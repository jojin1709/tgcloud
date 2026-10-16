import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/transfer_item.dart';
import '../models/file_item.dart';
import 'database_service.dart';

class TransferMobileService extends ChangeNotifier {
  static final TransferMobileService instance = TransferMobileService._internal();
  TransferMobileService._internal();

  final List<TGTransferItem> _transfers = [];
  List<TGTransferItem> get transfers => List.unmodifiable(_transfers);

  int get activeCount =>
      _transfers.where((t) => t.status == 'active' || t.status == 'queued').length;

  Future<void> init() async {
    final list = await DatabaseService.instance.listTransfers();
    _transfers.clear();
    _transfers.addAll(list);
    notifyListeners();
  }

  Future<String> startUpload(String filePath, String fileName, int fileSize, String? folderId) async {
    final id = const Uuid().v4();
    final now = DateTime.now().millisecondsSinceEpoch;

    final transfer = TGTransferItem(
      id: id,
      fileName: fileName,
      type: 'upload',
      status: 'active',
      progress: 0.0,
      bytesTotal: fileSize,
      bytesTransferred: 0,
      speedBytesPerSec: 0.0,
      etaSeconds: 0,
      createdAt: now,
      updatedAt: now,
      localPath: filePath,
    );

    _transfers.insert(0, transfer);
    await DatabaseService.instance.saveTransfer(transfer);
    notifyListeners();

    // Spawn upload stream simulator / chunked MTProto sender
    _runUploadSimulation(transfer, folderId);
    return id;
  }

  void _runUploadSimulation(TGTransferItem transfer, String? folderId) async {
    const chunkSize = 512 * 1024;
    int current = 0;
    final total = transfer.bytesTotal;

    Timer.periodic(const Duration(milliseconds: 300), (timer) async {
      if (transfer.status == 'paused' || transfer.status == 'cancelled') {
        timer.cancel();
        return;
      }

      current += chunkSize;
      if (current >= total) {
        current = total;
        transfer.status = 'completed';
        transfer.progress = 100.0;
        transfer.bytesTransferred = total;
        transfer.speedBytesPerSec = 0.0;
        transfer.etaSeconds = 0;
        transfer.updatedAt = DateTime.now().millisecondsSinceEpoch;
        timer.cancel();

        // Save file in database
        final file = TGFileItem(
          id: const Uuid().v4(),
          name: transfer.fileName,
          parentFolderId: folderId,
          telegramChatId: 77889900,
          telegramMessageId: DateTime.now().millisecondsSinceEpoch % 1000000,
          telegramFileId: 'tg_mobile_${transfer.id}',
          mimeType: 'application/octet-stream',
          size: total,
          createdAt: DateTime.now().millisecondsSinceEpoch,
          modifiedAt: DateTime.now().millisecondsSinceEpoch,
          status: 'synced',
        );
        await DatabaseService.instance.insertFile(file);
      } else {
        transfer.bytesTransferred = current;
        transfer.progress = (current / total) * 100.0;
        transfer.speedBytesPerSec = (chunkSize / 0.3);
        transfer.etaSeconds = ((total - current) / transfer.speedBytesPerSec).round();
        transfer.updatedAt = DateTime.now().millisecondsSinceEpoch;
      }

      await DatabaseService.instance.saveTransfer(transfer);
      notifyListeners();
    });
  }

  void pauseTransfer(String id) {
    final t = _transfers.firstWhere((element) => element.id == id);
    t.status = 'paused';
    DatabaseService.instance.saveTransfer(t);
    notifyListeners();
  }

  void resumeTransfer(String id) {
    final t = _transfers.firstWhere((element) => element.id == id);
    t.status = 'active';
    DatabaseService.instance.saveTransfer(t);
    notifyListeners();
  }

  void cancelTransfer(String id) {
    final t = _transfers.firstWhere((element) => element.id == id);
    t.status = 'cancelled';
    DatabaseService.instance.saveTransfer(t);
    notifyListeners();
  }
}

import 'package:flutter_test/flutter_test.dart';
import '../lib/models/user.dart';
import '../lib/models/folder_item.dart';
import '../lib/models/file_item.dart';
import '../lib/models/transfer_item.dart';

void main() {
  group('TGCloud Mobile Models Test', () {
    test('TGUser serialization and deserialization', () {
      final user = TGUser(
        id: 12345678,
        username: 'tguser_test',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        isPremium: true,
      );

      final map = user.toMap();
      expect(map['id'], 12345678);
      expect(map['username'], 'tguser_test');
      expect(map['is_premium'], 1);

      final fromMap = TGUser.fromMap(map);
      expect(fromMap.id, user.id);
      expect(fromMap.username, user.username);
      expect(fromMap.isPremium, true);
    });

    test('TGFolderItem serialization and properties', () {
      final folder = TGFolderItem(
        id: 'folder-1',
        name: 'Work',
        parentId: null,
        createdAt: 1000,
        modifiedAt: 1000,
        fileCount: 5,
        totalSize: 10240,
      );

      final map = folder.toMap();
      expect(map['name'], 'Work');
      expect(map['parent_id'], isNull);

      final fromMap = TGFolderItem.fromMap(map);
      expect(fromMap.id, 'folder-1');
      expect(fromMap.name, 'Work');
    });

    test('TGFileItem serialization and properties', () {
      final file = TGFileItem(
        id: 'file-1',
        name: 'report.pdf',
        parentFolderId: 'folder-1',
        telegramChatId: 998877,
        telegramMessageId: 42,
        telegramFileId: 'tg_doc_42',
        mimeType: 'application/pdf',
        size: 512000,
        createdAt: 2000,
        modifiedAt: 2000,
        isStarred: true,
        isTrash: false,
      );

      final map = file.toMap();
      expect(map['name'], 'report.pdf');
      expect(map['is_starred'], 1);

      final fromMap = TGFileItem.fromMap(map);
      expect(fromMap.id, 'file-1');
      expect(fromMap.telegramMessageId, 42);
      expect(fromMap.isStarred, true);
    });

    test('TGTransferItem serialization and progress calculation', () {
      final transfer = TGTransferItem(
        id: 'trans-1',
        fileName: 'backup.tar.gz',
        type: 'upload',
        status: 'active',
        progress: 75.5,
        bytesTotal: 10000000,
        bytesTransferred: 7550000,
        speedBytesPerSec: 1048576.0,
        etaSeconds: 2,
        createdAt: 3000,
        updatedAt: 3500,
      );

      final map = transfer.toMap();
      expect(map['file_name'], 'backup.tar.gz');
      expect(map['progress'], 75.5);

      final fromMap = TGTransferItem.fromMap(map);
      expect(fromMap.bytesTotal, 10000000);
      expect(fromMap.speedBytesPerSec, 1048576.0);
    });
  });
}

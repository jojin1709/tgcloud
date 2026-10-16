import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/transfer_service.dart';

class TransfersScreen extends StatelessWidget {
  const TransfersScreen({Key? key}) : super(key: key);

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  @override
  Widget build(BuildContext context) {
    final transferService = context.watch<TransferMobileService>();
    final transfers = transferService.transfers;

    return Scaffold(
      backgroundColor: const Color(0xFF0F141C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: const Text(
          'Transfers',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
      ),
      body: transfers.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.swap_vert, color: Color(0xFF475569), size: 48),
                  SizedBox(height: 12),
                  Text('No transfers', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Upload or download activity will show up here', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: transfers.length,
              itemBuilder: (context, index) {
                final t = transfers[index];
                final isCompleted = t.status == 'completed';
                final isPaused = t.status == 'paused';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF171E28),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF263345)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            t.type == 'upload' ? Icons.upload_outlined : Icons.download_outlined,
                            color: t.type == 'upload' ? const Color(0xFF2481CC) : const Color(0xFF10B981),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              t.fileName,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (!isCompleted)
                            IconButton(
                              icon: Icon(
                                isPaused ? Icons.play_arrow : Icons.pause,
                                color: Colors.white,
                                size: 18,
                              ),
                              onPressed: () {
                                if (isPaused) {
                                  transferService.resumeTransfer(t.id);
                                } else {
                                  transferService.pauseTransfer(t.id);
                                }
                              },
                            )
                          else
                            const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: isCompleted ? 1.0 : t.progress / 100.0,
                          backgroundColor: const Color(0xFF263345),
                          color: isCompleted ? const Color(0xFF10B981) : const Color(0xFF2481CC),
                          minHeight: 4,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_formatBytes(t.bytesTransferred)} / ${_formatBytes(t.bytesTotal)}',
                            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                          ),
                          Text(
                            isCompleted ? 'Finished' : '${t.progress.toStringAsFixed(1)}%',
                            style: TextStyle(
                              color: isCompleted ? const Color(0xFF10B981) : const Color(0xFF2481CC),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

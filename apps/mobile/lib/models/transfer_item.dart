class TGTransferItem {
  final String id;
  final String? fileId;
  final String fileName;
  final String type; // 'upload' | 'download'
  String status; // 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
  double progress;
  int bytesTotal;
  int bytesTransferred;
  double speedBytesPerSec;
  int etaSeconds;
  String? error;
  final int createdAt;
  int updatedAt;
  final String? localPath;

  TGTransferItem({
    required this.id,
    this.fileId,
    required this.fileName,
    required this.type,
    required this.status,
    this.progress = 0.0,
    required this.bytesTotal,
    this.bytesTransferred = 0,
    this.speedBytesPerSec = 0.0,
    this.etaSeconds = 0,
    this.error,
    required this.createdAt,
    required this.updatedAt,
    this.localPath,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'file_id': fileId,
      'file_name': fileName,
      'type': type,
      'status': status,
      'progress': progress,
      'bytes_total': bytesTotal,
      'bytes_transferred': bytesTransferred,
      'speed_bytes_per_sec': speedBytesPerSec,
      'eta_seconds': etaSeconds,
      'error': error,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'local_path': localPath,
    };
  }

  factory TGTransferItem.fromMap(Map<String, dynamic> map) {
    return TGTransferItem(
      id: map['id'] as String,
      fileId: map['file_id'] as String?,
      fileName: map['file_name'] as String,
      type: map['type'] as String,
      status: map['status'] as String,
      progress: (map['progress'] as num?)?.toDouble() ?? 0.0,
      bytesTotal: map['bytes_total'] as int,
      bytesTransferred: (map['bytes_transferred'] as int?) ?? 0,
      speedBytesPerSec: (map['speed_bytes_per_sec'] as num?)?.toDouble() ?? 0.0,
      etaSeconds: (map['eta_seconds'] as int?) ?? 0,
      error: map['error'] as String?,
      createdAt: map['created_at'] as int,
      updatedAt: map['updated_at'] as int,
      localPath: map['local_path'] as String?,
    );
  }
}

class TGFileItem {
  final String id;
  final String name;
  final String? parentFolderId;
  final int telegramChatId;
  final int telegramMessageId;
  final String telegramFileId;
  final String mimeType;
  final int size;
  final String? hash;
  final int createdAt;
  final int modifiedAt;
  final String? thumbnailPath;
  final String status;
  final bool isStarred;
  final bool isTrash;

  TGFileItem({
    required this.id,
    required this.name,
    this.parentFolderId,
    required this.telegramChatId,
    required this.telegramMessageId,
    required this.telegramFileId,
    required this.mimeType,
    required this.size,
    this.hash,
    required this.createdAt,
    required this.modifiedAt,
    this.thumbnailPath,
    this.status = 'synced',
    this.isStarred = false,
    this.isTrash = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'parent_folder_id': parentFolderId,
      'telegram_chat_id': telegramChatId,
      'telegram_message_id': telegramMessageId,
      'telegram_file_id': telegramFileId,
      'mime_type': mimeType,
      'size': size,
      'hash': hash,
      'created_at': createdAt,
      'modified_at': modifiedAt,
      'thumbnail_path': thumbnailPath,
      'status': status,
      'is_starred': isStarred ? 1 : 0,
      'is_trash': isTrash ? 1 : 0,
    };
  }

  factory TGFileItem.fromMap(Map<String, dynamic> map) {
    return TGFileItem(
      id: map['id'] as String,
      name: map['name'] as String,
      parentFolderId: map['parent_folder_id'] as String?,
      telegramChatId: map['telegram_chat_id'] as int,
      telegramMessageId: map['telegram_message_id'] as int,
      telegramFileId: map['telegram_file_id'] as String,
      mimeType: map['mime_type'] as String,
      size: map['size'] as int,
      hash: map['hash'] as String?,
      createdAt: map['created_at'] as int,
      modifiedAt: map['modified_at'] as int,
      thumbnailPath: map['thumbnail_path'] as String?,
      status: (map['status'] as String?) ?? 'synced',
      isStarred: (map['is_starred'] as int? ?? 0) == 1,
      isTrash: (map['is_trash'] as int? ?? 0) == 1,
    );
  }
}

class TGFolderItem {
  final String id;
  final String name;
  final String? parentId;
  final int createdAt;
  final int modifiedAt;
  final int fileCount;
  final int totalSize;

  TGFolderItem({
    required this.id,
    required this.name,
    this.parentId,
    required this.createdAt,
    required this.modifiedAt,
    this.fileCount = 0,
    this.totalSize = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'parent_id': parentId,
      'created_at': createdAt,
      'modified_at': modifiedAt,
    };
  }

  factory TGFolderItem.fromMap(Map<String, dynamic> map) {
    return TGFolderItem(
      id: map['id'] as String,
      name: map['name'] as String,
      parentId: map['parent_id'] as String?,
      createdAt: map['created_at'] as int,
      modifiedAt: map['modified_at'] as int,
      fileCount: (map['file_count'] as int?) ?? 0,
      totalSize: (map['total_size'] as int?) ?? 0,
    );
  }
}

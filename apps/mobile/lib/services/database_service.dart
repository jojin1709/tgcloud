import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../models/user.dart';
import '../models/folder_item.dart';
import '../models/file_item.dart';
import '../models/transfer_item.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._internal();
  static Database? _database;

  DatabaseService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final docsDir = await getApplicationDocumentsDirectory();
    final dbPath = p.join(docsDir.path, 'tgcloud_mobile.db');

    return await openDatabase(
      dbPath,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT,
            phone TEXT,
            is_premium INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL
          );
        ''');

        await db.execute('''
          CREATE TABLE folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT,
            created_at INTEGER NOT NULL,
            modified_at INTEGER NOT NULL,
            FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
          );
        ''');

        await db.execute('''
          CREATE TABLE files (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_folder_id TEXT,
            telegram_chat_id INTEGER NOT NULL,
            telegram_message_id INTEGER NOT NULL,
            telegram_file_id TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INTEGER NOT NULL,
            hash TEXT,
            created_at INTEGER NOT NULL,
            modified_at INTEGER NOT NULL,
            thumbnail_path TEXT,
            status TEXT NOT NULL DEFAULT 'synced',
            is_starred INTEGER NOT NULL DEFAULT 0,
            is_trash INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE SET NULL
          );
        ''');

        await db.execute('''
          CREATE TABLE transfers (
            id TEXT PRIMARY KEY,
            file_id TEXT,
            file_name TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            progress REAL NOT NULL DEFAULT 0.0,
            bytes_total INTEGER NOT NULL DEFAULT 0,
            bytes_transferred INTEGER NOT NULL DEFAULT 0,
            speed_bytes_per_sec REAL NOT NULL DEFAULT 0.0,
            eta_seconds INTEGER NOT NULL DEFAULT 0,
            error TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            local_path TEXT
          );
        ''');

        await db.execute('''
          CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
        ''');

        await db.execute('CREATE INDEX idx_files_folder ON files(parent_folder_id);');
        await db.execute('CREATE INDEX idx_files_starred ON files(is_starred);');
        await db.execute('CREATE INDEX idx_files_trash ON files(is_trash);');
      },
    );
  }

  // User
  Future<void> saveUser(TGUser user) async {
    final db = await database;
    await db.insert(
      'users',
      {...user.toMap(), 'updated_at': DateTime.now().millisecondsSinceEpoch},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<TGUser?> getUser() async {
    final db = await database;
    final maps = await db.query('users', orderBy: 'updated_at DESC', limit: 1);
    if (maps.isNotEmpty) {
      return TGUser.fromMap(maps.first);
    }
    return null;
  }

  Future<void> clearUser() async {
    final db = await database;
    await db.delete('users');
  }

  // Folders
  Future<void> insertFolder(TGFolderItem folder) async {
    final db = await database;
    await db.insert('folders', folder.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<TGFolderItem>> listFolders(String? parentId) async {
    final db = await database;
    final List<Map<String, dynamic>> results;
    if (parentId == null) {
      results = await db.rawQuery('''
        SELECT f.*,
          (SELECT COUNT(*) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as file_count,
          (SELECT COALESCE(SUM(size), 0) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as total_size
        FROM folders f
        WHERE f.parent_id IS NULL
        ORDER BY f.name COLLATE NOCASE ASC
      ''');
    } else {
      results = await db.rawQuery('''
        SELECT f.*,
          (SELECT COUNT(*) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as file_count,
          (SELECT COALESCE(SUM(size), 0) FROM files WHERE parent_folder_id = f.id AND is_trash = 0) as total_size
        FROM folders f
        WHERE f.parent_id = ?
        ORDER BY f.name COLLATE NOCASE ASC
      ''', [parentId]);
    }
    return results.map((m) => TGFolderItem.fromMap(m)).toList();
  }

  Future<void> deleteFolder(String id) async {
    final db = await database;
    await db.delete('folders', where: 'id = ?', whereArgs: [id]);
  }

  // Files
  Future<void> insertFile(TGFileItem file) async {
    final db = await database;
    await db.insert('files', file.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<TGFileItem>> listFiles({
    String? folderId,
    bool starredOnly = false,
    bool trashOnly = false,
  }) async {
    final db = await database;
    final List<Map<String, dynamic>> maps;

    if (trashOnly) {
      maps = await db.query('files', where: 'is_trash = 1', orderBy: 'modified_at DESC');
    } else if (starredOnly) {
      maps = await db.query(
        'files',
        where: 'is_starred = 1 AND is_trash = 0',
        orderBy: 'modified_at DESC',
      );
    } else if (folderId == null) {
      maps = await db.query(
        'files',
        where: 'parent_folder_id IS NULL AND is_trash = 0',
        orderBy: 'modified_at DESC',
      );
    } else {
      maps = await db.query(
        'files',
        where: 'parent_folder_id = ? AND is_trash = 0',
        whereArgs: [folderId],
        orderBy: 'modified_at DESC',
      );
    }
    return maps.map((m) => TGFileItem.fromMap(m)).toList();
  }

  Future<void> toggleStarFile(String id, bool isStarred) async {
    final db = await database;
    await db.update('files', {'is_starred': isStarred ? 1 : 0}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> setFileTrash(String id, bool isTrash) async {
    final db = await database;
    await db.update('files', {'is_trash': isTrash ? 1 : 0}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteFilePermanent(String id) async {
    final db = await database;
    await db.delete('files', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<TGFileItem>> searchFiles(String term) async {
    final db = await database;
    final maps = await db.query(
      'files',
      where: 'name LIKE ? AND is_trash = 0',
      whereArgs: ['%$term%'],
      orderBy: 'modified_at DESC',
    );
    return maps.map((m) => TGFileItem.fromMap(m)).toList();
  }

  // Transfers
  Future<void> saveTransfer(TGTransferItem transfer) async {
    final db = await database;
    await db.insert('transfers', transfer.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<TGTransferItem>> listTransfers() async {
    final db = await database;
    final maps = await db.query('transfers', orderBy: 'created_at DESC');
    return maps.map((m) => TGTransferItem.fromMap(m)).toList();
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/file_item.dart';
import '../models/folder_item.dart';
import '../services/database_service.dart';

class FilesScreen extends StatefulWidget {
  final VoidCallback onOpenUploadSheet;

  const FilesScreen({Key? key, required this.onOpenUploadSheet}) : super(key: key);

  @override
  State<FilesScreen> createState() => _FilesScreenState();
}

class _FilesScreenState extends State<FilesScreen> {
  String? _currentFolderId;
  String _currentFolderName = 'My Files';
  final List<TGFolderItem> _folders = [];
  final List<TGFileItem> _files = [];
  bool _isLoading = false;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final folders = await DatabaseService.instance.listFolders(_currentFolderId);
      final files = await DatabaseService.instance.listFiles(folderId: _currentFolderId);
      setState(() {
        _folders.clear();
        _folders.addAll(folders);
        _files.clear();
        _files.addAll(files);
      });
    } catch (e) {
      debugPrint('Load files error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F141C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F141C),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.cloud_outlined, color: Color(0xFF2481CC), size: 24),
            const SizedBox(width: 8),
            Text(
              _currentFolderId == null ? 'TGCloud' : _currentFolderName,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
            ),
          ],
        ),
        leading: _currentFolderId != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Colors.white),
                onPressed: () {
                  setState(() {
                    _currentFolderId = null;
                    _currentFolderName = 'My Files';
                  });
                  _loadData();
                },
              )
            : null,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF2481CC),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            // Search Bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF171E28),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF263345)),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Search files...',
                  hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                  prefixIcon: Icon(Icons.search, color: Color(0xFF94A3B8), size: 20),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 12),
                ),
                onSubmitted: (term) async {
                  if (term.trim().isNotEmpty) {
                    final searchResults = await DatabaseService.instance.searchFiles(term.trim());
                    setState(() {
                      _files.clear();
                      _files.addAll(searchResults);
                      _folders.clear();
                    });
                  } else {
                    _loadData();
                  }
                },
              ),
            ),

            const SizedBox(height: 12),

            // Folders Section
            if (_folders.isNotEmpty) ...[
              const Text(
                'Folders',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _folders.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final folder = _folders[index];
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _currentFolderId = folder.id;
                          _currentFolderName = folder.name;
                        });
                        _loadData();
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: 130,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF171E28),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF263345)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Icon(Icons.folder, color: Color(0xFF2481CC), size: 30),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  folder.name,
                                  style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 13),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  '${folder.fileCount} items',
                                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Files Section
            const Text(
              'Files',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Color(0xFF94A3B8),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            if (_files.isEmpty && !_isLoading)
              Container(
                padding: const EdgeInsets.all(40),
                alignment: Alignment.center,
                child: Column(
                  children: const [
                    Icon(Icons.inbox_outlined, color: Color(0xFF475569), size: 48),
                    SizedBox(height: 12),
                    Text('No files here', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Tap + to upload files to your Telegram vault', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  ],
                ),
              ),

            ..._files.map((file) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF171E28),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF263345)),
                ),
                child: ListTile(
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2481CC).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.insert_drive_file, color: Color(0xFF2481CC), size: 22),
                  ),
                  title: Text(
                    file.name,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    '${_formatBytes(file.size)} • ${DateFormat.MMMd().format(DateTime.fromMillisecondsSinceEpoch(file.modifiedAt))}',
                    style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                  ),
                  trailing: IconButton(
                    icon: Icon(
                      file.isStarred ? Icons.star : Icons.star_border,
                      color: file.isStarred ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                      size: 20,
                    ),
                    onPressed: () async {
                      await DatabaseService.instance.toggleStarFile(file.id, !file.isStarred);
                      _loadData();
                    },
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

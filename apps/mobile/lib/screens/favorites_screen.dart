import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/file_item.dart';
import '../services/database_service.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({Key? key}) : super(key: key);

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final List<TGFileItem> _starredFiles = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    setState(() => _isLoading = true);
    final files = await DatabaseService.instance.listFiles(starredOnly: true);
    setState(() {
      _starredFiles.clear();
      _starredFiles.addAll(files);
      _isLoading = false;
    });
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
        title: const Text(
          'Starred Files',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
      ),
      body: _starredFiles.isEmpty && !_isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.star_outline, color: Color(0xFF475569), size: 48),
                  SizedBox(height: 12),
                  Text('No starred files', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Star your favorite Telegram files to find them quickly', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _starredFiles.length,
              itemBuilder: (context, index) {
                final file = _starredFiles[index];
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
                    ),
                    subtitle: Text(
                      '${_formatBytes(file.size)} • ${DateFormat.MMMd().format(DateTime.fromMillisecondsSinceEpoch(file.modifiedAt))}',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.star, color: Color(0xFFF59E0B), size: 20),
                      onPressed: () async {
                        await DatabaseService.instance.toggleStarFile(file.id, false);
                        _loadFavorites();
                      },
                    ),
                  ),
                );
              },
            ),
    );
  }
}

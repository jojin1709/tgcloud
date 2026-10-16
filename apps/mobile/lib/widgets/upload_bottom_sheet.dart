import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';
import '../services/transfer_service.dart';

class UploadBottomSheet extends StatelessWidget {
  final String? currentFolderId;
  final VoidCallback onFileUploaded;

  const UploadBottomSheet({
    Key? key,
    this.currentFolderId,
    required this.onFileUploaded,
  }) : super(key: key);

  Future<void> _pickFiles(BuildContext context) async {
    Navigator.pop(context);
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result != null && result.files.isNotEmpty) {
      final transferService = context.read<TransferMobileService>();
      for (final file in result.files) {
        if (file.path != null) {
          await transferService.startUpload(
            file.path!,
            file.name,
            file.size,
            currentFolderId,
          );
        }
      }
      onFileUploaded();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF171E28),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: const Color(0xFF334155),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Text(
            'Upload to Telegram Cloud',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 20),
          _OptionTile(
            icon: Icons.insert_drive_file_outlined,
            title: 'Upload Files',
            subtitle: 'Documents, archives, media, any files',
            color: const Color(0xFF2481CC),
            onTap: () => _pickFiles(context),
          ),
          _OptionTile(
            icon: Icons.photo_library_outlined,
            title: 'Choose From Gallery',
            subtitle: 'Upload photos or videos from camera roll',
            color: const Color(0xFF10B981),
            onTap: () => _pickFiles(context),
          ),
          _OptionTile(
            icon: Icons.camera_alt_outlined,
            title: 'Take Photo',
            subtitle: 'Capture and upload directly to vault',
            color: const Color(0xFFF59E0B),
            onTap: () => _pickFiles(context),
          ),
          _OptionTile(
            icon: Icons.create_new_folder_outlined,
            title: 'Upload Folder',
            subtitle: 'Upload an entire folder to Telegram',
            color: const Color(0xFF8B5CF6),
            onTap: () => _pickFiles(context),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _OptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }
}

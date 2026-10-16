# TGCloud Privacy Policy

## 1. Zero Telemetry & Zero Data Collection

TGCloud is open-source software created to give users complete sovereignty over their data.

- **No Third-Party Analytics**: TGCloud does not integrate Google Analytics, Firebase, Sentry, Mixpanel, or any tracking SDKs.
- **No Remote Telemetry**: No logs, hardware identifiers, IP addresses, or file names are ever reported to TGCloud developers or any third-party server.
- **Direct P2P/Telegram Network**: All network packets leave your computer or phone and travel directly to Telegram MTProto data centers (e.g. `149.154.167.50:443` or regional datacenters).

---

## 2. Your Telegram Account & Data

- **Storage Location**: TGCloud stores your files inside a dedicated private Telegram channel or in your personal "Saved Messages" chat. Only you and the sessions you authorize in your Telegram account have access to these files.
- **Telegram Privacy Policy**: Because Telegram functions as the remote storage backend, your data on Telegram servers is subject to [Telegram's Privacy Policy](https://telegram.org/privacy).
- **Deletion**: When you delete a file in TGCloud, TGCloud sends a delete command to Telegram to remove the corresponding message and its binary document from your private storage channel.

---

## 3. Local Data Storage

All indexing information is kept strictly on your local device:
- **SQLite Database**: Stored locally in your user profile (`%APPDATA%\TGCloud\tgcloud.db`).
- **Cache**: Thumbnail and preview caches are kept locally and can be cleared at any time from *Settings -> Storage -> Clear Cache*.
- **Logout & Purge**: Using the *Logout* or *Clear Local Data* feature instantly removes the Telegram MTProto session and metadata from your device.

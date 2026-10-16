# Telegram API Setup Guide for TGCloud

To connect TGCloud directly to Telegram via official MTProto protocols, you will need your own official `TELEGRAM_API_ID` and `TELEGRAM_API_HASH`.

---

## 1. Obtaining Official Telegram API Credentials

1. Open your web browser and navigate to:
   **[https://my.telegram.org](https://my.telegram.org)**

2. Log in with your phone number and confirm the security code sent to your Telegram app.

3. Click on **API development tools**.

4. If prompted to create an application, enter:
   - **App title**: `TGCloud` (or your preferred name)
   - **Short name**: `tgcloud`
   - **Platform**: `Desktop`
   - **Description**: `Personal Telegram cloud storage file manager`

5. Click **Create application**.

6. Once created, you will see:
   - **App api_id**: (e.g. `12345678`)
   - **App api_hash**: (e.g. `abcdef0123456789abcdef0123456789`)

---

## 2. Configuring Credentials in TGCloud

Create a `.env` file in the root directory (copied from `.env.example`):

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef0123456789abcdef0123456789
```

> [!IMPORTANT]
> Never commit your real `.env` file to Git. TGCloud's `.gitignore` explicitly excludes `.env` to prevent credential exposure.

---

## 3. Account Privacy & Two-Step Verification

- TGCloud supports standard phone login codes as well as **Two-Step Verification (2FA cloud passwords)**.
- If you have 2FA enabled in your Telegram account, TGCloud will securely prompt you for your cloud password during the SRP challenge.
- Your password is used in-memory during the ephemeral authentication handshake and is **never saved to disk or logged**.

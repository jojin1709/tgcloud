use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use sha2::{Digest, Sha256};
use rand::RngCore;
use std::path::Path;
use crate::error::AppError;

pub struct CryptoService;

impl CryptoService {
    /// Derive a 256-bit AES key from a user passphrase and salt with key-stretching
    pub fn derive_key(passphrase: &str, salt: &[u8]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(passphrase.as_bytes());
        hasher.update(salt);
        let mut key = hasher.finalize();

        // Perform 5,000 rounds of key stretching
        for _ in 0..5_000 {
            let mut round_hasher = Sha256::new();
            round_hasher.update(&key);
            round_hasher.update(salt);
            key = round_hasher.finalize();
        }

        let mut out = [0u8; 32];
        out.copy_from_slice(&key);
        out
    }

    /// Encrypt plaintext bytes using client-side Zero-Knowledge AES-256-GCM.
    /// Wire format: [16 bytes salt] [12 bytes nonce] [ciphertext + 16 bytes auth tag]
    pub fn encrypt_bytes(data: &[u8], passphrase: &str) -> Result<Vec<u8>, AppError> {
        let mut salt = [0u8; 16];
        let mut nonce_bytes = [0u8; 12];
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut salt);
        rng.fill_bytes(&mut nonce_bytes);

        let key = Self::derive_key(passphrase, &salt);
        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| AppError::internal(format!("AES cipher init failure: {}", e)))?;
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher.encrypt(nonce, data)
            .map_err(|e| AppError::internal(format!("Encryption error: {}", e)))?;

        let mut output = Vec::with_capacity(16 + 12 + ciphertext.len());
        output.extend_from_slice(&salt);
        output.extend_from_slice(&nonce_bytes);
        output.extend_from_slice(&ciphertext);
        Ok(output)
    }

    /// Decrypt ciphertext bytes using client-side Zero-Knowledge AES-256-GCM.
    pub fn decrypt_bytes(encrypted_data: &[u8], passphrase: &str) -> Result<Vec<u8>, AppError> {
        if encrypted_data.len() < 16 + 12 + 16 {
            return Err(AppError::invalid_input("Ciphertext too short for valid AES-256-GCM"));
        }

        let salt = &encrypted_data[0..16];
        let nonce_bytes = &encrypted_data[16..28];
        let ciphertext = &encrypted_data[28..];

        let key = Self::derive_key(passphrase, salt);
        let cipher = Aes256Gcm::new_from_slice(&key)
            .map_err(|e| AppError::internal(format!("AES cipher init failure: {}", e)))?;
        let nonce = Nonce::from_slice(nonce_bytes);

        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|_| AppError::invalid_input("Decryption failed. Incorrect passphrase or corrupted file."))?;

        Ok(plaintext)
    }

    /// Encrypt a local file into a target path
    pub async fn encrypt_file(source: &Path, destination: &Path, passphrase: &str) -> Result<(), AppError> {
        let content = tokio::fs::read(source).await?;
        let encrypted = Self::encrypt_bytes(&content, passphrase)?;
        tokio::fs::write(destination, encrypted).await?;
        Ok(())
    }

    /// Decrypt a local file into a target path
    pub async fn decrypt_file(source: &Path, destination: &Path, passphrase: &str) -> Result<(), AppError> {
        let content = tokio::fs::read(source).await?;
        let decrypted = Self::decrypt_bytes(&content, passphrase)?;
        tokio::fs::write(destination, decrypted).await?;
        Ok(())
    }
}

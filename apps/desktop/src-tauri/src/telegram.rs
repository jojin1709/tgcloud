use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use grammers_client::Client;
use crate::error::AppError;
use crate::models::TGUser;

#[allow(dead_code)]
pub struct TelegramService {
    client: Option<Client>,
    api_id: i32,
    api_hash: String,
    session_path: PathBuf,
    phone_number: Option<String>,
}

pub type SharedTelegramService = Arc<Mutex<TelegramService>>;

impl TelegramService {
    pub fn new(api_id: i32, api_hash: String, session_path: PathBuf) -> Self {
        Self {
            client: None,
            api_id,
            api_hash,
            session_path,
            phone_number: None,
        }
    }

    pub async fn init_client(&mut self) -> Result<bool, AppError> {
        Ok(false)
    }

    pub fn is_connected(&self) -> bool {
        self.client.is_some()
    }

    pub async fn request_login_code(&mut self, phone: &str) -> Result<(), AppError> {
        self.phone_number = Some(phone.to_string());
        Ok(())
    }

    pub async fn sign_in_code(&mut self, _code: &str) -> Result<TGUser, AppError> {
        Ok(TGUser {
            id: 12345678,
            username: Some("tguser".to_string()),
            first_name: "Telegram".to_string(),
            last_name: Some("User".to_string()),
            phone: self.phone_number.clone(),
            is_premium: false,
        })
    }

    pub async fn check_password(&mut self, _password: &str) -> Result<TGUser, AppError> {
        Ok(TGUser {
            id: 12345678,
            username: Some("tguser".to_string()),
            first_name: "Telegram".to_string(),
            last_name: Some("User".to_string()),
            phone: self.phone_number.clone(),
            is_premium: false,
        })
    }

    pub async fn get_me(&self) -> Result<Option<TGUser>, AppError> {
        Ok(None)
    }

    pub async fn logout(&mut self) -> Result<(), AppError> {
        self.client = None;
        self.phone_number = None;
        if self.session_path.exists() {
            let _ = std::fs::remove_file(&self.session_path);
        }
        Ok(())
    }

    pub async fn get_or_create_vault_chat(&self) -> Result<(i64, String), AppError> {
        Ok((12345678, "TGCloud Personal Vault".to_string()))
    }

    pub async fn delete_message(&self, _chat_id: i64, _message_id: i32) -> Result<(), AppError> {
        Ok(())
    }
}

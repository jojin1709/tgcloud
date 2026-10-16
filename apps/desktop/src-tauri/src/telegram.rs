use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use grammers_client::client::{LoginToken, PasswordToken};
use grammers_client::sender::SenderPool;
use grammers_client::{Client, SignInError};
use grammers_tl_types as tl;
use crate::error::AppError;
use crate::models::TGUser;
use crate::session::FileSession;

pub struct TelegramService {
    client: Option<Client>,
    login_token: Option<LoginToken>,
    password_token: Option<PasswordToken>,
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
            login_token: None,
            password_token: None,
            api_id,
            api_hash,
            session_path,
            phone_number: None,
        }
    }

    pub async fn ensure_client(&mut self) -> Result<Client, AppError> {
        if let Some(c) = &self.client {
            return Ok(c.clone());
        }

        let session = Arc::new(FileSession::load_or_create(self.session_path.clone())?);
        let pool = SenderPool::new(session, self.api_id);
        tokio::spawn(pool.runner.run());
        let client = Client::new(pool.handle);
        self.client = Some(client.clone());
        Ok(client)
    }

    pub async fn is_authorized(&mut self) -> Result<bool, AppError> {
        let client = self.ensure_client().await?;
        let auth = client.is_authorized().await?;
        Ok(auth)
    }

    pub async fn request_login_code(&mut self, phone: &str) -> Result<(), AppError> {
        let client = self.ensure_client().await?;
        let token = client.request_login_code(phone, &self.api_hash).await?;
        self.phone_number = Some(phone.to_string());
        self.login_token = Some(token);
        Ok(())
    }

    pub async fn sign_in_code(&mut self, code: &str) -> Result<TGUser, AppError> {
        let client = self.ensure_client().await?;
        let token = self.login_token.as_ref()
            .ok_or_else(|| AppError::invalid_input("No pending login token. Please request code first."))?;

        match client.sign_in(token, code).await {
            Ok(user) => {
                let tg_user = self.extract_tg_user(&user)?;
                self.login_token = None;
                Ok(tg_user)
            }
            Err(SignInError::PasswordRequired(pwd_token)) => {
                self.password_token = Some(pwd_token);
                Err(AppError::new("PASSWORD_REQUIRED", "Two-step verification password is required."))
            }
            Err(err) => Err(err.into()),
        }
    }

    pub async fn check_password(&mut self, password: &str) -> Result<TGUser, AppError> {
        let client = self.ensure_client().await?;
        let pwd_token = self.password_token.take()
            .ok_or_else(|| AppError::invalid_input("No pending 2FA password prompt."))?;

        match client.check_password(pwd_token, password.as_bytes()).await {
            Ok(user) => {
                let tg_user = self.extract_tg_user(&user)?;
                self.login_token = None;
                Ok(tg_user)
            }
            Err(SignInError::InvalidPassword(token)) => {
                self.password_token = Some(token);
                Err(AppError::new("INVALID_PASSWORD", "Incorrect two-step verification password."))
            }
            Err(err) => Err(err.into()),
        }
    }

    fn extract_tg_user(&self, user: &grammers_client::peer::User) -> Result<TGUser, AppError> {
        let is_premium = match &user.raw {
            tl::enums::User::User(u) => u.premium,
            _ => false,
        };

        Ok(TGUser {
            id: user.raw.id(),
            username: user.username().map(|s| s.to_string()),
            first_name: user.first_name().unwrap_or("Telegram User").to_string(),
            last_name: user.last_name().map(|s| s.to_string()),
            phone: user.phone().map(|s| s.to_string()).or_else(|| self.phone_number.clone()),
            is_premium,
        })
    }

    pub async fn get_me(&mut self) -> Result<Option<TGUser>, AppError> {
        if self.is_authorized().await.unwrap_or(false) {
            let client = self.ensure_client().await?;
            if let Ok(me) = client.get_me().await {
                return Ok(Some(self.extract_tg_user(&me)?));
            }
        }
        Ok(None)
    }

    pub async fn logout(&mut self) -> Result<(), AppError> {
        if let Some(client) = self.client.take() {
            let _ = client.sign_out().await;
        }
        self.login_token = None;
        self.password_token = None;
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

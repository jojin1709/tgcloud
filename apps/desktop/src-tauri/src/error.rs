use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}]: {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

impl AppError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn auth_failed(msg: impl Into<String>) -> Self {
        Self::new("AUTH_FAILED", msg)
    }

    pub fn invalid_input(msg: impl Into<String>) -> Self {
        Self::new("INVALID_INPUT", msg)
    }

    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::new("NOT_FOUND", msg)
    }

    pub fn telegram_error(msg: impl Into<String>) -> Self {
        Self::new("TELEGRAM_ERROR", msg)
    }

    pub fn io_error(msg: impl Into<String>) -> Self {
        Self::new("IO_ERROR", msg)
    }

    pub fn db_error(msg: impl Into<String>) -> Self {
        Self::new("DB_ERROR", msg)
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        Self::io_error(e.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        Self::db_error(e.to_string())
    }
}

use std::fmt;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use parking_lot::Mutex;
use grammers_session::{BoxFuture, Session, SessionData};
use grammers_session::types::{ChannelState, DcOption, PeerId, PeerInfo, UpdateState, UpdatesState};
use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub enum SessionError {
    Io(std::io::Error),
    Json(serde_json::Error),
}

impl fmt::Display for SessionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(e) => write!(f, "Session I/O error: {e}"),
            Self::Json(e) => write!(f, "Session JSON serialization error: {e}"),
        }
    }
}

impl std::error::Error for SessionError {}

impl From<std::io::Error> for SessionError {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e)
    }
}

impl From<serde_json::Error> for SessionError {
    fn from(e: serde_json::Error) -> Self {
        Self::Json(e)
    }
}

#[derive(Serialize, Deserialize)]
struct StoredSessionData {
    home_dc: i32,
    dc_options: Vec<DcOption>,
    peer_infos: Vec<PeerInfo>,
    updates_state: UpdatesState,
}

pub struct FileSession {
    path: PathBuf,
    data: Arc<Mutex<SessionData>>,
}

impl FileSession {
    pub fn load_or_create(path: PathBuf) -> Result<Self, SessionError> {
        let mut session_data = SessionData::default();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(stored) = serde_json::from_str::<StoredSessionData>(&content) {
                    session_data.home_dc = stored.home_dc;
                    for dc in stored.dc_options {
                        session_data.dc_options.insert(dc.id, dc);
                    }
                    for peer in stored.peer_infos {
                        session_data.peer_infos.insert(peer.id(), peer);
                    }
                    session_data.updates_state = stored.updates_state;
                }
            }
        }
        Ok(Self {
            path,
            data: Arc::new(Mutex::new(session_data)),
        })
    }

    fn save(&self) -> Result<(), SessionError> {
        let data = self.data.lock();
        let stored = StoredSessionData {
            home_dc: data.home_dc,
            dc_options: data.dc_options.values().cloned().collect(),
            peer_infos: data.peer_infos.values().cloned().collect(),
            updates_state: data.updates_state.clone(),
        };
        drop(data);

        let json = serde_json::to_string_pretty(&stored)?;
        if let Some(parent) = self.path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let tmp = self.path.with_extension("tmp");
        fs::write(&tmp, json)?;
        let _ = fs::rename(&tmp, &self.path);
        Ok(())
    }
}

impl Session for FileSession {
    type Error = SessionError;

    fn home_dc_id(&self) -> Result<i32, Self::Error> {
        Ok(self.data.lock().home_dc)
    }

    fn set_home_dc_id(&self, dc_id: i32) -> BoxFuture<'_, Result<(), Self::Error>> {
        Box::pin(async move {
            self.data.lock().home_dc = dc_id;
            let _ = self.save();
            Ok(())
        })
    }

    fn dc_option(&self, dc_id: i32) -> Result<Option<DcOption>, Self::Error> {
        Ok(self.data.lock().dc_options.get(&dc_id).cloned())
    }

    fn set_dc_option(&self, dc_option: &DcOption) -> BoxFuture<'_, Result<(), Self::Error>> {
        let dc_option = dc_option.clone();
        Box::pin(async move {
            self.data.lock().dc_options.insert(dc_option.id, dc_option);
            let _ = self.save();
            Ok(())
        })
    }

    fn peer(&self, peer: PeerId) -> BoxFuture<'_, Result<Option<PeerInfo>, Self::Error>> {
        Box::pin(async move {
            Ok(self.data.lock().peer_infos.get(&peer).cloned())
        })
    }

    fn cache_peer(&self, peer: PeerInfo) -> BoxFuture<'_, Result<(), Self::Error>> {
        Box::pin(async move {
            let mut data = self.data.lock();
            data.peer_infos
                .entry(peer.id())
                .or_insert_with(|| peer.clone())
                .extend_info(&peer);
            drop(data);
            let _ = self.save();
            Ok(())
        })
    }

    fn cache_peers(&self, peers: Vec<PeerInfo>) -> BoxFuture<'_, Result<(), Self::Error>> {
        Box::pin(async move {
            let mut data = self.data.lock();
            for peer in peers {
                data.peer_infos
                    .entry(peer.id())
                    .or_insert_with(|| peer.clone())
                    .extend_info(&peer);
            }
            drop(data);
            let _ = self.save();
            Ok(())
        })
    }

    fn updates_state(&self) -> BoxFuture<'_, Result<UpdatesState, Self::Error>> {
        Box::pin(async move {
            Ok(self.data.lock().updates_state.clone())
        })
    }

    fn set_update_state(&self, update: UpdateState) -> BoxFuture<'_, Result<(), Self::Error>> {
        Box::pin(async move {
            let mut data = self.data.lock();
            match update {
                UpdateState::All(updates_state) => {
                    data.updates_state = updates_state;
                }
                UpdateState::Primary { pts, date, seq } => {
                    data.updates_state.pts = pts;
                    data.updates_state.date = date;
                    data.updates_state.seq = seq;
                }
                UpdateState::Secondary { qts } => {
                    data.updates_state.qts = qts;
                }
                UpdateState::Channel { id, pts } => {
                    data.updates_state.channels.retain(|c| c.id != id);
                    data.updates_state.channels.push(ChannelState { id, pts });
                }
            }
            drop(data);
            let _ = self.save();
            Ok(())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_file_session_persistence() {
        let temp_dir = std::env::temp_dir();
        let session_file = temp_dir.join(format!("test_session_{}.json", uuid::Uuid::new_v4()));

        let session = FileSession::load_or_create(session_file.clone()).expect("Failed to create session");
        assert_eq!(session.home_dc_id().unwrap(), 2);

        session.set_home_dc_id(4).await.expect("Failed to set home dc");
        assert_eq!(session.home_dc_id().unwrap(), 4);

        // Load a new instance from the exact same file to verify persistence
        let reloaded = FileSession::load_or_create(session_file.clone()).expect("Failed to reload session");
        assert_eq!(reloaded.home_dc_id().unwrap(), 4);

        let _ = fs::remove_file(session_file);
    }
}


use std::fs::File;
use std::io::Write;
use std::panic;

fn main() {
    std::env::set_var("RUST_BACKTRACE", "1");
    panic::set_hook(Box::new(|info| {
        let payload = if let Some(s) = info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            format!("{:?}", info)
        };
        let location = info.location().map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column())).unwrap_or_default();
        let bt = std::backtrace::Backtrace::force_capture();
        let msg = format!("PANIC: {}\nLocation: {}\nBacktrace:\n{:?}", payload, location, bt);
        eprintln!("{}", msg);
        if let Some(dirs) = directories::ProjectDirs::from("com", "tgcloud", "desktop") {
            let _ = std::fs::create_dir_all(dirs.data_dir());
            if let Ok(mut f) = File::create(dirs.data_dir().join("crash.log")) {
                let _ = f.write_all(msg.as_bytes());
            }
        }
    }));

    tgcloud_desktop_lib::run();
}

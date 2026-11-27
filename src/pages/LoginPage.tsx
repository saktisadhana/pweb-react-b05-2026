import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useCursorLight } from '../components/seno/useCursorLight';
import { MIN_PASSWORD, type RegisterInput } from '../utils/auth';
// Background login dibuat ulang sebagai SVG (scripts/build-login-bg.py), jadi tetap tajam di layar apa pun.
import loginBg from '../assets/login-bg.svg';
import { TileBtn, type Box } from '../components/seno/OverlayTile';
import { enterDelay } from '../components/seno/grid';

// Frame Figma "Login" (node 415:2), 1440 x 848.
const FRAME_W = 1440;
const FRAME_H = 848;
const NARROW = 900; // di HP hanya bagian kiri (tile login) yang ditampilkan
const CROP_X = 80;
const CROP_W = 960;

type Mode = 'login' | 'register';

// Posisi tile dari frame Figma (setelah tile dipecah jadi grup mask sendiri-sendiri).
const T = {
  submit: { x: 306, y: 170, w: 415, h: 100 },
  username: { x: 95, y: 275, w: 415, h: 100 },
  eye: { x: 516, y: 275, w: 100, h: 100 },
  password: { x: 95, y: 380, w: 415, h: 100 },
  clear: { x: 516, y: 380, w: 100, h: 100 },
  mode: { x: 725, y: 380, w: 207, h: 100 },
  status: { x: 517, y: 485, w: 513, h: 100 },
} satisfies Record<string, Box>;

const boxStyle = (b: Box): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h, '--d': `${enterDelay(b)}ms` } as CSSProperties);

interface LoginPageProps {
  onLogin: (username: string, password: string, remember: boolean) => Promise<void>;
  onRegister: (input: RegisterInput, remember: boolean) => Promise<void>;
  onGuest: () => void;
}

export function LoginPage({ onLogin, onRegister, onGuest }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0, height: FRAME_H, narrow: false });
  useLayoutEffect(() => {
    let timer = 0;
    const measure = () => {
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      if (vw < NARROW) {
        const scale = vw / CROP_W;
        setFit({ scale, x: -CROP_X * scale, y: 0, height: Math.max(vh, FRAME_H * scale), narrow: true });
      } else {
        // Isi lebar layar; kalau layar lebih tinggi dari frame, frame diletakkan di tengah.
        const scale = vw / FRAME_W;
        const h = FRAME_H * scale;
        setFit({ scale, x: 0, y: Math.max(0, (vh - h) / 2), height: Math.max(vh, h), narrow: false });
      }
    };
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 100);
    };
    measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const moveRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLElement>(null);
  useCursorLight(moveRef, spotRef, !fit.narrow);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword('');
    usernameRef.current?.focus();
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // "Ingat saya" selalu aktif: desain login tidak punya tile untuk itu.
      if (mode === 'login') await onLogin(username, password, true);
      else await onRegister({ name: '', username, password, confirmPassword: password }, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  // Tulisan besar di tile status harus pendek (font 48px), alasan lengkapnya di baris kecil.
  const status = busy ? '/ Checking...' : error ? '/ Try Again' : mode === 'login' ? '/ Please Login' : '/ New Account';
  const detail = error ?? (mode === 'login' ? null : `Username 3-20 karakter, password minimal ${MIN_PASSWORD} karakter.`);

  return (
    <main className={`login${fit.narrow ? ' is-narrow' : ''}`} style={{ height: fit.height }}>
      <h1 className="sr-only">Seno Magang Portal, {mode === 'login' ? 'login' : 'daftar akun'}</h1>
      <div
        className="login__frame"
        style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`, width: FRAME_W, height: FRAME_H }}
      >
        <div className="login__move" ref={moveRef}>
          <img className="login__bg" src={loginBg} alt="" width={FRAME_W} height={FRAME_H} draggable={false} />
          <i className="spot" ref={spotRef} aria-hidden="true" />
        </div>

        <form onSubmit={submit} noValidate aria-label={mode === 'login' ? 'Masuk' : 'Daftar akun baru'}>
          <TileBtn box={T.submit} tone="amber" label={mode === 'login' ? 'Login' : 'Daftar'} type="submit" disabled={busy}>
            <span className="lbl lbl--on-amber" style={{ left: 45, top: 23 }}>
              {mode === 'login' ? '> Login' : '> Daftar'}
            </span>
          </TileBtn>

          <label className={`lt lt--navy lt--input${error ? ' is-error' : ''}`} style={boxStyle(T.username)}>
            <span className="sr-only">Username</span>
            <input
              ref={usernameRef}
              className="lt__input lbl--on-navy"
              placeholder=">/ Username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <TileBtn box={T.eye} tone="amber" label={showPassword ? 'Sembunyikan password' : 'Lihat password'} pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
            <span className="lt__icon lbl--on-amber" data-glyph="<o>" aria-hidden="true" />
          </TileBtn>

          <label className={`lt lt--amber lt--input${error ? ' is-error' : ''}`} style={boxStyle(T.password)}>
            <span className="sr-only">Password</span>
            <input
              className="lt__input lbl--on-amber"
              type={showPassword ? 'text' : 'password'}
              placeholder=">/ Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <TileBtn
            box={T.clear}
            tone="navy"
            label="Kosongkan isian"
            onClick={() => {
              setUsername('');
              setPassword('');
              setError(null);
              usernameRef.current?.focus();
            }}
          >
            <span className="lt__icon lbl--on-navy" data-glyph="-" aria-hidden="true" />
          </TileBtn>

          <TileBtn box={T.mode} tone="navy" label={mode === 'login' ? 'Daftar akun baru' : 'Login dengan akun lama'} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
            <span className="lbl lbl--on-navy lbl--small" style={{ left: 22, top: 30 }}>
              {mode === 'login' ? '> Daftar' : '> Login'}
            </span>
          </TileBtn>
        </form>

        <div className={`lt lt--amber lt--status${error ? ' is-error' : ''}`} style={boxStyle(T.status)} role="status" aria-live="polite">
          <span className="lbl lbl--on-amber" style={{ left: 33, top: 12 }}>{status}</span>
          <span className="lt__detail">
            {detail ?? (
              <>
                Belum punya akun? Pilih <b>&gt; Daftar</b>, atau{' '}
                <button type="button" className="lt__link" onClick={onGuest}>coba demo tanpa akun</button>
              </>
            )}
          </span>
        </div>
      </div>
    </main>
  );
}

import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initFirebase } from '../firebase';

initFirebase();
const auth = getAuth();

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuth(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onAuth(userCredential.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-panel" style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 16px #0002',
      padding: '32px 24px',
      maxWidth: 350,
      margin: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18
    }}>
      <h2 style={{marginBottom: 18, color: '#1a2233', fontWeight: 700, fontSize: 28, letterSpacing: 0.5}}>
        {isLogin ? 'Iniciar sesión' : 'Registrarse'}
      </h2>
      <form onSubmit={handleSubmit} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: 14}}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d0d4db',
            fontSize: 16,
            outline: 'none',
            transition: 'border 0.2s',
            marginBottom: 2
          }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d0d4db',
            fontSize: 16,
            outline: 'none',
            transition: 'border 0.2s',
            marginBottom: 2
          }}
        />
        <button type="submit" style={{
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 0',
          fontSize: 17,
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: 6,
          boxShadow: '0 1px 4px #2563eb22'
        }}>{isLogin ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)} style={{
        marginTop: 8,
        background: 'none',
        border: 'none',
        color: '#2563eb',
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: 15
      }}>
        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
      {error && <div style={{color:'crimson', marginTop:10, fontSize:15, textAlign:'center'}}>{error}</div>}
    </div>
  );
}

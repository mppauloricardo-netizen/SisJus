import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CONEXÃO COM O SUPABASE ──────────────────────────────────────────────────
const SUPABASE_URL = "https://ufpuforxuypbwuqpkarf.supabase.co";
const SUPABASE_KEY = "sb_publishable_FdVU4uUNreIuYg4hL2gpYg_Fg_NY5mP";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CONFIGURAÇÕES ESTÁTICAS ─────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Dr. Marcus Oliveira", role: "juiz", badge: "MAG-0042", password: "juiz123", avatar: "⚖️" },
  { id: 2, name: "Dra. Camila Torres", role: "promotor", badge: "MP-0117", password: "promotor123", avatar: "📋" },
  { id: 3, name: "Del. Ricardo Fonseca", role: "delegado", badge: "DEL-0309", password: "delegado123", avatar: "🔍" },
  { id: 4, name: "Adv. Felipe Martins", role: "advogado", badge: "OAB-7891", password: "advogado123", avatar: "⚖️" },
  { id: 5, name: "Del. Sandra Lima", role: "delegado", badge: "DEL-0218", password: "delegado456", avatar: "🔍" },
  { id: 6, name: "Dra. Ana Beatriz", role: "promotor", badge: "MP-0231", password: "promotor456", avatar: "📋" },
];

const ROLE_LABELS = { juiz: "Juiz(a)", promotor: "Promotor(a)", delegado: "Delegado(a)", advogado: "Advogado(a)" };
const ROLE_COLORS = { juiz: "#c9a84c", promotor: "#e05c5c", delegado: "#5b9bd5", advogado: "#6bbf7a" };
const STATUS_LABELS = { investigacao: "Em Investigação", indiciado: "Indiciado", aguardando_audiencia: "Aguardando Audiência", em_julgamento: "Em Julgamento", condenado: "Condenado", absolvido: "Absolvido", arquivado: "Arquivado" };
const STATUS_COLORS = { investigacao: "#5b9bd5", indiciado: "#e09a3c", aguardando_audiencia: "#9b7fd4", em_julgamento: "#e05c5c", condenado: "#c94c4c", absolvido: "#6bbf7a", arquivado: "#666" };

// ─── ESTILOS (CSS) ───────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #060a12; color: #d4c9b0; font-family: 'Source Serif 4', serif; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .login-bg { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(#0d1f3c, #060a12); }
  .login-card { background: #0d1726; padding: 3rem; border-top: 3px solid #c9a84c; width: 400px; border-radius: 4px; text-align: center; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; background: #0a1220; border-right: 1px solid #1a2535; padding: 20px; }
  .main { flex: 1; padding: 40px; overflow-y: auto; }
  .card { background: #0d1726; border: 1px solid #1a2535; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
  .case-card { border-left: 4px solid var(--sc); cursor: pointer; transition: 0.2s; }
  .case-card:hover { background: #121e31; transform: translateX(5px); }
  input, select, textarea { width: 100%; padding: 12px; margin: 10px 0; background: #060a12; border: 1px solid #1e2d45; color: white; }
  button { background: #c9a84c; color: #060a12; padding: 12px; border: none; font-weight: bold; cursor: pointer; width: 100%; text-transform: uppercase; }
  .badge { padding: 4px 8px; border-radius: 3px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
  .timeline-item { border-left: 1px solid #1a2535; margin-left: 20px; padding: 0 0 20px 20px; position: relative; }
  .timeline-dot { position: absolute; left: -6px; top: 0; width: 11px; height: 11px; background: #c9a84c; border-radius: 50%; }
`;

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function JusticeSystem() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [selectedCase, setSelectedCase] = useState(null);
  const [loginForm, setLoginForm] = useState({ userId: "", password: "" });

  // 1. BUSCAR DADOS (Fetch)
  const fetchCases = async () => {
    const { data, error } = await supabase.from('processos').select('*').order('criado_em', { ascending: false });
    if (!error) setCases(data);
  };

  // 2. REALTIME (Escutar mudanças de outros usuários)
  useEffect(() => {
    fetchCases();
    const channel = supabase.channel('realtime-processos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processos' }, () => {
        fetchCases();
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // 3. LOGICA DE LOGIN
  const handleLogin = () => {
    const found = USERS.find(u => u.id === parseInt(loginForm.userId) && u.password === loginForm.password);
    if (found) setUser(found); else alert("Credenciais Inválidas");
  };

  // 4. CRIAR PROCESSO
  const handleNewCase = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newCase = {
      numero: `PROC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      titulo: `Estado vs. ${form.reu.value}`,
      reu: form.reu.value,
      crime: form.crime.value,
      status: "investigacao",
      delegado_id: user.id,
      eventos: [{
        id: Date.now(), tipo: "ocorrencia", titulo: "Registro Inicial",
        descricao: form.desc.value, autorId: user.id, timestamp: new Date().toISOString(), editavel_por: ["delegado"]
      }]
    };
    const { error } = await supabase.from('processos').insert([newCase]);
    if (!error) { setPage("dashboard"); form.reset(); }
  };

  // 5. ATUALIZAR STATUS OU EVENTO
  const updateCase = async (updatedCase) => {
    const { error } = await supabase.from('processos').update(updatedCase).eq('id', updatedCase.id);
    if (error) alert("Erro ao atualizar banco.");
  };

  if (!user) return (
    <div className="login-bg">
      <style>{styles}</style>
      <div className="login-card">
        <h2 style={{color: '#c9a84c', marginBottom: '20px'}}>⚖️ SISJUS LOGIN</h2>
        <select onChange={e => setLoginForm({...loginForm, userId: e.target.value})}>
          <option value="">Selecione seu Usuário</option>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>)}
        </select>
        <input type="password" placeholder="Senha" onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
        <button onClick={handleLogin}>Entrar</button>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{styles}</style>
      <div className="layout">
        <aside className="sidebar">
          <h2 style={{color: '#c9a84c', marginBottom: '30px', fontSize: '1.2rem'}}>TRIBUNAL DE JUSTIÇA</h2>
          <div className="card" style={{padding: '10px'}}>
            <strong>{user.name}</strong><br/>
            <small style={{color: ROLE_COLORS[user.role]}}>{ROLE_LABELS[user.role]}</small>
          </div>
          <button onClick={() => {setPage("dashboard"); setSelectedCase(null)}}>🏛️ Painel Geral</button>
          {user.role === 'delegado' && <button onClick={() => setPage("novo")} style={{marginTop: '10px'}}>➕ Novo Processo</button>}
          <button onClick={() => setUser(null)} style={{marginTop: 'auto', background: '#e05c5c'}}>Sair</button>
        </aside>

        <main className="main">
          {page === "dashboard" && (
            <div>
              <h3>Processos Ativos</h3>
              {cases.map(c => (
                <div key={c.id} className="card case-card" style={{"--sc": STATUS_COLORS[c.status]}} onClick={() => {setSelectedCase(c); setPage("detalhe")}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <strong>{c.numero} - {c.titulo}</strong>
                    <span className="badge" style={{color: STATUS_COLORS[c.status]}}>{STATUS_LABELS[c.status]}</span>
                  </div>
                  <small>Réu: {c.reu} | Aberto em: {new Date(c.criado_em).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}

          {page === "novo" && (
            <div className="card">
              <h3>Abertura de Inquérito</h3>
              <form onSubmit={handleNewCase}>
                <label>Nome do Réu</label><input name="reu" required />
                <label>Capitulação (Crimes)</label><input name="crime" required />
                <label>Relato da Ocorrência</label><textarea name="desc" rows="5" required />
                <button type="submit">Registrar no Banco de Dados</button>
              </form>
            </div>
          )}

          {page === "detalhe" && selectedCase && (
            <CaseDetail 
              c={cases.find(x => x.id === selectedCase.id)} 
              user={user} 
              onUpdate={updateCase} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

function CaseDetail({ c, user, onUpdate }) {
  const [newDesc, setNewDesc] = useState("");

  const addMovimentacao = () => {
    if (!newDesc) return;
    const novoEvento = {
      id: Date.now(),
      tipo: "despacho",
      titulo: `Movimentação - ${ROLE_LABELS[user.role]}`,
      descricao: newDesc,
      autorId: user.id,
      timestamp: new Date().toISOString(),
      editavel_por: [user.role]
    };
    onUpdate({ ...c, eventos: [...c.eventos, novoEvento] });
    setNewDesc("");
  };

  return (
    <div>
      <div className="card" style={{borderTop: `4px solid ${STATUS_COLORS[c.status]}`}}>
        <h2>{c.titulo}</h2>
        <p><strong>Status:</strong> {STATUS_LABELS[c.status]}</p>
        <p><strong>Crimes:</strong> {c.crime}</p>
      </div>

      <h3>Histórico Processual</h3>
      {c.eventos.map(e => (
        <div key={e.id} className="timeline-item">
          <div className="timeline-dot"></div>
          <div className="card">
            <strong>{e.titulo}</strong>
            <p>{e.descricao}</p>
            <small>Por: {USERS.find(u => u.id === e.autorId)?.name} em {new Date(e.timestamp).toLocaleString()}</small>
          </div>
        </div>
      ))}

      <div className="card">
        <h4>Adicionar Movimentação</h4>
        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Digite o despacho ou defesa..." rows="3" />
        <button onClick={addMovimentacao}>Protocolar nos Autos</button>
      </div>
    </div>
  );
}

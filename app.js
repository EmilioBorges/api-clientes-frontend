const API_URL_USUARIOS = "http://127.0.0.1:8000/usuarios/";
const API_URL_ENDERECOS = "http://127.0.0.1:8000/enderecos/";

const form = document.getElementById("cadastroForm");
const usuarioIdInput = document.getElementById("usuarioId");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const idadeInput = document.getElementById("idade");
const telefoneInput = document.getElementById("telefone");
const senhaInput = document.getElementById("senha");
const btnToggleSenha = document.getElementById("btnToggleSenha");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelarEdicao");
const feedback = document.getElementById("feedback");
const listaUsuarios = document.getElementById("listaUsuarios");
const inputBusca = document.getElementById("inputBusca");
const btnBuscar = document.getElementById("btnBuscar");
const btnLimparBusca = document.getElementById("btnLimparBusca");

const modalEndereco = document.getElementById("modalEndereco");
const btnAbrirModal = document.getElementById("btnAbrirModalEndereco");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnDeletarEndereco = document.getElementById("btnDeletarEndereco");
const enderecoForm = document.getElementById("enderecoForm");

let enderecoTemporario = null;

function exibirFeedback(mensagem, tipo) {
  feedback.className = `feedback-message ${tipo}`;
  feedback.innerText = tipo === "success" ? `[✓] ${mensagem}` : `[✕] ${mensagem}`;
  setTimeout(() => { feedback.style.display = 'none'; feedback.className = 'feedback-message'; }, 5000);
}

btnToggleSenha.addEventListener("click", () => {
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    btnToggleSenha.innerText = "👁️‍🗨️";
  } else {
    senhaInput.type = "password";
    btnToggleSenha.innerText = "👁️";
  }
});

// ==========================================
// 1. Orquestração de POST/PUT (Cliente + Endereço)
// ==========================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const btnTextoOriginal = btnSalvar.innerText;
  btnSalvar.innerText = "A processar...";
  btnSalvar.disabled = true;

  const id = usuarioIdInput.value;
  const isEdicao = Boolean(id);

  const dadosUsuario = {
    nome: nomeInput.value,
    email: emailInput.value,
    idade: parseInt(idadeInput.value),
    telefone: telefoneInput.value
  };
  if (senhaInput.value.trim() !== "") {
    dadosUsuario.senha = senhaInput.value;
  }

  try {
    // Passo 1: Salvar Cliente
    const resUser = await fetch(isEdicao ? `${API_URL_USUARIOS}${id}` : API_URL_USUARIOS, {
      method: isEdicao ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosUsuario)
    });

    if (!resUser.ok) {
      const err = await resUser.json();
      throw new Error(Array.isArray(err.detail) ? err.detail[0].msg : err.detail);
    }

    const userData = await resUser.json();
    const userId = userData.id; // Pega o ID gerado (ou editado)

    // Passo 2: Salvar Endereço Separadamente (Se houver)
    if (enderecoTemporario) {
      enderecoTemporario.usuario_id = userId; // Vincula ao cliente
      const isEdicaoEnd = Boolean(enderecoTemporario.id);
      const urlEnd = isEdicaoEnd ? `${API_URL_ENDERECOS}${enderecoTemporario.id}` : API_URL_ENDERECOS;

      const resEnd = await fetch(urlEnd, {
        method: isEdicaoEnd ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enderecoTemporario)
      });

      if (!resEnd.ok) throw new Error("Cliente salvo, mas falha ao salvar endereço.");
    }

    exibirFeedback(isEdicao ? "Cadastro atualizado com sucesso!" : "Cliente cadastrado com sucesso!", "success");
    resetarFormulario();
    if (isEdicao && inputBusca.value.trim() !== "") btnBuscar.click();

  } catch (err) {
    exibirFeedback("Erro: " + err.message, "error");
  } finally {
    btnSalvar.innerText = btnTextoOriginal;
    btnSalvar.disabled = false;
  }
});

// ==========================================
// 2. Anexar Endereço Temporário (Memória)
// ==========================================
enderecoForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const endId = enderecoTemporario ? enderecoTemporario.id : null;
  enderecoTemporario = {
    id: endId,
    cep: document.getElementById("cep").value,
    logradouro: document.getElementById("logradouro").value,
    bairro: document.getElementById("bairro").value,
    localidade: document.getElementById("localidade").value,
    uf: document.getElementById("uf").value,
    numero: document.getElementById("numero").value
  };

  modalEndereco.classList.remove("show");
  btnAbrirModal.innerText = "✏️ Endereço Anexado (Clique para alterar)";
  btnAbrirModal.style.backgroundColor = "var(--success)";
});

document.getElementById("cep").addEventListener("blur", async (e) => {
  const cep = e.target.value.replace(/\D/g, "");
  if (cep.length === 8) {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        document.getElementById("logradouro").value = data.logradouro;
        document.getElementById("bairro").value = data.bairro;
        document.getElementById("localidade").value = data.localidade;
        document.getElementById("uf").value = data.uf;
        document.getElementById("numero").focus();
      } else {
        exibirFeedback("CEP não encontrado.", "error");
      }
    } catch {
      exibirFeedback("Erro ao consultar o ViaCEP.", "error");
    }
  }
});

btnAbrirModal.addEventListener("click", () => {
  if (enderecoTemporario) {
    document.getElementById("cep").value = enderecoTemporario.cep || "";
    document.getElementById("logradouro").value = enderecoTemporario.logradouro || "";
    document.getElementById("bairro").value = enderecoTemporario.bairro || "";
    document.getElementById("localidade").value = enderecoTemporario.localidade || "";
    document.getElementById("uf").value = enderecoTemporario.uf || "";
    document.getElementById("numero").value = enderecoTemporario.numero || "";

    btnDeletarEndereco.style.display = enderecoTemporario.id ? "block" : "none";
  } else {
    btnDeletarEndereco.style.display = "none";
  }
  modalEndereco.classList.add("show");
});

btnDeletarEndereco.addEventListener("click", async () => {
  if (!enderecoTemporario || !enderecoTemporario.id) return;
  if (!confirm("Tem certeza que deseja excluir permanentemente este endereço?")) return;

  try {
    const response = await fetch(`${API_URL_ENDERECOS}${enderecoTemporario.id}`, { method: "DELETE" });
    if (response.ok) {
      exibirFeedback("Endereço excluído com sucesso!", "success");
      enderecoTemporario = null;
      enderecoForm.reset();
      modalEndereco.classList.remove("show");
      btnAbrirModal.innerText = "➕ Cadastrar Endereço";
      btnAbrirModal.style.backgroundColor = "#64748B";
      if (inputBusca.value.trim() !== "") btnBuscar.click();
    } else {
      exibirFeedback("Erro ao remover endereço.", "error");
    }
  } catch {
    exibirFeedback("Erro de conexão ao remover endereço.", "error");
  }
});

btnFecharModal.addEventListener("click", () => modalEndereco.classList.remove("show"));
window.addEventListener("click", (e) => { if (e.target === modalEndereco) modalEndereco.classList.remove("show"); });

// ==========================================
// 3. Listar e Ações GET/DELETE Cliente
// ==========================================
btnBuscar.addEventListener("click", async () => {
  const termo = inputBusca.value.trim();
  if (!termo) {
    listaUsuarios.innerHTML = "<p style='color: var(--text-muted); font-weight: bold;'>[i] Digite um nome ou e-mail.</p>";
    return;
  }

  listaUsuarios.innerHTML = "<p style='color: var(--text-muted);'>A pesquisar...</p>";

  try {
    const res = await fetch(`${API_URL_USUARIOS}?busca=${encodeURIComponent(termo)}`);
    const usuarios = await res.json();
    listaUsuarios.innerHTML = "";

    if (usuarios.length === 0) {
      listaUsuarios.innerHTML = "<p style='color: var(--text-muted);'>Nenhum cadastro encontrado.</p>";
      return;
    }

    usuarios.forEach((u) => {
      const card = document.createElement("div");
      card.className = "user-card";
      const txtEndereco = u.endereco ? `${u.endereco.logradouro}, ${u.endereco.numero} - ${u.endereco.localidade}/${u.endereco.uf}` : "Sem endereço cadastrado";
      const endCodificado = u.endereco ? encodeURIComponent(JSON.stringify(u.endereco)) : "null";

      card.innerHTML = `
                <div class="user-info">
                    <p><strong>${u.nome}</strong> (ID: ${u.id})</p>
                    <p>E-mail: ${u.email}</p>
                    <p>Idade: ${u.idade} anos | Tel: ${u.telefone}</p>
                    <p style="font-size: 0.85rem; color: var(--primary); margin-top: 6px;">📍 ${txtEndereco}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="prepararEdicao(${u.id}, '${u.nome}', '${u.email}', ${u.idade}, '${u.telefone}', '${endCodificado}')">Editar</button>
                    <button class="btn-delete" onclick="deletarUsuario(${u.id})">Excluir</button>
                </div>
            `;
      listaUsuarios.appendChild(card);
    });
  } catch {
    listaUsuarios.innerHTML = "<p style='color: var(--danger); font-weight: bold;'>[✕] Erro ao comunicar com o servidor.</p>";
  }
});

inputBusca.addEventListener("keypress", (e) => {
  if (e.key === "Enter") { e.preventDefault(); btnBuscar.click(); }
});

btnLimparBusca.addEventListener("click", () => {
  inputBusca.value = "";
  listaUsuarios.innerHTML = "";
});

function prepararEdicao(id, nome, email, idade, telefone, enderecoBase64) {
  usuarioIdInput.value = id;
  nomeInput.value = nome;
  emailInput.value = email;
  idadeInput.value = idade;
  telefoneInput.value = telefone;
  senhaInput.value = "";
  senhaInput.placeholder = "Nova senha (deixe em branco para manter)";
  document.getElementById("senhaOpcionalText").innerText = "(opcional na edição)";

  if (enderecoBase64 !== "null") {
    enderecoTemporario = JSON.parse(decodeURIComponent(enderecoBase64));
    btnAbrirModal.innerText = "✏️ Editar Endereço Existente";
    btnAbrirModal.style.backgroundColor = "var(--success)";
  } else {
    enderecoTemporario = null;
    btnAbrirModal.innerText = "➕ Cadastrar Endereço";
    btnAbrirModal.style.backgroundColor = "#64748B";
  }

  btnSalvar.innerText = "Atualizar Cadastro";
  btnCancelar.style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetarFormulario() {
  form.reset();
  enderecoForm.reset();
  usuarioIdInput.value = "";
  enderecoTemporario = null;
  btnSalvar.innerText = "Cadastrar Usuário";
  btnCancelar.style.display = "none";
  document.getElementById("senhaOpcionalText").innerText = "*";
  senhaInput.placeholder = "••••••••";
  btnAbrirModal.innerText = "➕ Cadastrar Endereço";
  btnAbrirModal.style.backgroundColor = "#64748B";
}

btnCancelar.addEventListener("click", resetarFormulario);

async function deletarUsuario(id) {
  if (!confirm(`Tem certeza que deseja remover permanentemente o cliente (ID: ${id})?`)) return;
  try {
    const response = await fetch(`${API_URL_USUARIOS}${id}`, { method: "DELETE" });
    if (response.ok) {
      exibirFeedback("Cadastro excluído com sucesso!", "success");
      if (inputBusca.value.trim() !== "") btnBuscar.click(); else listaUsuarios.innerHTML = "";
    } else {
      exibirFeedback("Erro ao tentar remover o cadastro.", "error");
    }
  } catch {
    exibirFeedback("Erro de conexão.", "error");
  }
}
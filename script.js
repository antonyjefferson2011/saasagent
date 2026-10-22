// ==========================================
// CONFIGURAÇÕES DO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBzqQmGpMz-7AYM7_Mpt2owpmf6BXjW1yk",
  authDomain: "nucisz.firebaseapp.com",
  databaseURL: "https://nucisz-default-rtdb.firebaseio.com",
  projectId: "nucisz",
  storageBucket: "nucisz.firebasestorage.app",
  messagingSenderId: "90824519141",
  appId: "1:90824519141:web:8ec5d6686c07cbbf94930c",
  measurementId: "G-BZ4S7Q3NM2"
};

// Inicializa o Firebase (usando a versão compatível via CDN)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const ADMIN_PASSWORD = "admin123"; // MUDE SUA SENHA AQUI

// ==========================================
// FUNÇÕES DA PÁGINA PÚBLICA (index.html)
// ==========================================
function renderPublicPage() {
    const container = document.getElementById("links-container");
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#fff;">Carregando...</p>';

    // Busca os links no Realtime Database
    database.ref('links').once('value').then((snapshot) => {
        const data = snapshot.val();
        container.innerHTML = "";

        if (!data) {
            container.innerHTML = '<p style="text-align:center; color:#fff;">Nenhum link cadastrado.</p>';
            return;
        }

        // O Firebase retorna um objeto, transformamos em array
        const links = Object.values(data);

        links.forEach(link => {
            const a = document.createElement("a");
            a.href = link.url;
            a.className = "link-card";
            a.target = "_blank";
            a.innerHTML = `<i class="fas ${link.icon || 'fa-link'}"></i> <span>${link.title}</span>`;
            container.appendChild(a);
        });
    }).catch((error) => {
        console.error(error);
        container.innerHTML = '<p style="text-align:center; color:#ff6b6b;">Erro ao carregar os links.</p>';
    });
}

// ==========================================
// FUNÇÕES DO PAINEL DE ADMIN (painel.html)
// ==========================================
function initAdminPanel() {
    const loginForm = document.getElementById("login-form");
    
    // Lógica de Login
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const pass = document.getElementById("password-input").value;
            const error = document.getElementById("login-error");

            if (pass === ADMIN_PASSWORD) {
                sessionStorage.setItem("logado", "true");
                showDashboard();
            } else {
                if(error) error.innerText = "Senha incorreta!";
            }
        });
    }

    // Lógica de Adicionar Link
    const linkForm = document.getElementById("link-form");
    if (linkForm) {
        linkForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const btn = linkForm.querySelector("button");
            const originalText = btn.innerHTML;
            btn.innerHTML = "Salvando...";
            btn.disabled = true;

            const title = document.getElementById("link-title").value;
            const url = document.getElementById("link-url").value;
            const icon = document.getElementById("link-icon").value;

            // Salva no Firebase
            database.ref('links').push({
                title: title,
                url: url,
                icon: icon,
                createdAt: Date.now()
            }).then(() => {
                linkForm.reset();
                btn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
                renderAdminList();
            }).catch((error) => {
                alert("Erro ao salvar: " + error.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        });
    }

    // Verifica se já está logado
    if (sessionStorage.getItem("logado") === "true") {
        showDashboard();
    }
}

function showDashboard() {
    const loginScreen = document.getElementById("login-screen");
    const dashboard = document.getElementById("dashboard-screen");
    if (loginScreen && dashboard) {
        loginScreen.classList.add("hidden");
        dashboard.classList.remove("hidden");
        renderAdminList();
    }
}

function logout() {
    sessionStorage.removeItem("logado");
    window.location.reload();
}

function renderAdminList() {
    const list = document.getElementById("admin-links-list");
    if (!list) return;

    list.innerHTML = "<p>Carregando...</p>";

    database.ref('links').once('value').then((snapshot) => {
        const data = snapshot.val();
        list.innerHTML = "";

        if (!data) {
            list.innerHTML = '<p class="empty-state">Nenhum link cadastrado.</p>';
            return;
        }

        // Pega as chaves (IDs gerados pelo Firebase) e os valores
        const entries = Object.entries(data);

        // Ordena pelo mais antigo (createdAt)
        entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

        entries.forEach(([id, link]) => {
            const div = document.createElement("div");
            div.className = "admin-link-card";
            div.innerHTML = `
                <div class="link-info">
                    <div class="link-icon"><i class="fas ${link.icon || 'fa-link'}"></i></div>
                    <div class="link-details">
                        <strong>${link.title}</strong>
                        <span>${link.url}</span>
                    </div>
                </div>
                <button onclick="removeLink('${id}')" class="btn-delete"><i class="fas fa-trash-alt"></i></button>
            `;
            list.appendChild(div);
        });
    }).catch((error) => {
        list.innerHTML = "<p>Erro ao carregar a lista.</p>";
    });
}

function removeLink(id) {
    if (confirm("Excluir este link?")) {
        database.ref('links/' + id).remove().then(() => {
            renderAdminList();
        }).catch((error) => {
            alert("Erro ao excluir: " + error.message);
        });
    }
}

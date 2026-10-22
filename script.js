// ==========================================
// CONFIGURAÇÕES DO SUPABASE (COLOQUE AS SUAS AQUI)
// ==========================================
const SUPABASE_URL = 'SUA_URL_DO_SUPABASE_AQUI'; // Ex: https://xyz.supabase.co
const SUPABASE_KEY = 'SUA_CHAVE_ANON_PUBLIC_AQUI'; // Ex: eyJhbGci...
const ADMIN_PASSWORD = "admin123"; // Sua senha do painel

// Inicializa o cliente Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// FUNÇÕES DA PÁGINA PÚBLICA (index.html)
// ==========================================
async function renderPublicPage() {
    const container = document.getElementById("links-container");
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color:#fff;">Carregando...</p>';

    // Busca os links no banco de dados Supabase
    const { data: links, error } = await supabaseClient
        .from('links')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Erro ao buscar links:", error);
        container.innerHTML = '<p style="text-align:center; color:#ff6b6b;">Erro ao carregar os links.</p>';
        return;
    }

    container.innerHTML = "";

    if (links.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#fff;">Nenhum link cadastrado.</p>';
        return;
    }

    links.forEach(link => {
        const a = document.createElement("a");
        a.href = link.url;
        a.className = "link-card";
        a.target = "_blank";
        a.innerHTML = `<i class="fas ${link.icon || 'fa-link'}"></i> <span>${link.title}</span>`;
        container.appendChild(a);
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
        linkForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const btn = linkForm.querySelector("button");
            const originalText = btn.innerHTML;
            btn.innerHTML = "Salvando...";
            btn.disabled = true;

            const title = document.getElementById("link-title").value;
            const url = document.getElementById("link-url").value;
            const icon = document.getElementById("link-icon").value;

            // Insere o novo link no Supabase
            const { error } = await supabaseClient
                .from('links')
                .insert([{ title: title, url: url, icon: icon }]);

            if (error) {
                alert("Erro ao salvar: " + error.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            linkForm.reset();
            btn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
            
            renderAdminList();
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

async function renderAdminList() {
    const list = document.getElementById("admin-links-list");
    if (!list) return;

    list.innerHTML = "<p>Carregando...</p>";

    const { data: links, error } = await supabaseClient
        .from('links')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        list.innerHTML = "<p>Erro ao carregar a lista.</p>";
        return;
    }

    list.innerHTML = "";

    if (links.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhum link cadastrado.</p>';
        return;
    }

    links.forEach((link) => {
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
            <button onclick="removeLink(${link.id})" class="btn-delete"><i class="fas fa-trash-alt"></i></button>
        `;
        list.appendChild(div);
    });
}

async function removeLink(id) {
    if (confirm("Excluir este link?")) {
        const { error } = await supabaseClient
            .from('links')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Erro ao excluir: " + error.message);
            return;
        }
        renderAdminList();
    }
}

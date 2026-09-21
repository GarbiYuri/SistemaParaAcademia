const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("form-login");
    const alertMessage = document.getElementById("alert-message");
    const btnSubmit = document.getElementById("btn-submit");
    const btnText = document.getElementById("btn-text");
    const btnSpinner = document.getElementById("btn-spinner");

    // Redireciona direto se já houver sessão ativa
    if (localStorage.getItem("user_session")) {
        window.location.href = "/dashboard";
        return;
    }

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Reset da interface
        alertMessage.classList.add("d-none");
        btnSubmit.disabled = true;
        btnText.textContent = "Autenticando...";
        btnSpinner.classList.remove("d-none");

        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        try {
            const response = await fetch(`${API_URL}/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Erro ao realizar login");
            }

            // Guardar sessão do utilizador
            localStorage.setItem("user_session", JSON.stringify(data.usuario));

            // Redireciona para o handler de dashboard na API
            window.location.href = "/dashboard";

        } catch (error) {
            alertMessage.textContent = error.message;
            alertMessage.classList.remove("d-none");
        } finally {
            btnSubmit.disabled = false;
            btnText.textContent = "Entrar no Sistema";
            btnSpinner.classList.add("d-none");
        }
    });
});
const form = document.getElementById('formDenuncia'); 


form.addEventListener('submit', async (event) => {
    event.preventDefault();

    console.log("Botão clicado! Preparando para enviar...");

    
    const dados = {
        local: document.getElementById('local').value,
        data: document.getElementById('data').value,
        gravidade: document.getElementById('gravidade').value,
        descricao: document.getElementById('descricao').value,
        status: "Pendente"
    };

    console.log("Dados capturados:", dados);

    
    try {
        const resposta = await fetch('/denuncias', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            const resultado = await resposta.json();
            alert("Denúncia cadastrada com sucesso!");
            form.reset();
        } else {
            alert("Erro no servidor: " + resposta.status);
        }
    } catch (erro) {
        console.error("Erro na conexão:", erro);
        alert("Erro: O servidor (Node) está desligado ou o endereço está errado.");
    }
});
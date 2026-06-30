const API = "/denuncias";

async function carregarDenuncias() {

    const resposta = await fetch(API);

    const denuncias = await resposta.json();

    const lista = document.getElementById("listaDenuncias");

    lista.innerHTML = "";

    denuncias.forEach(denuncia => {

        lista.innerHTML += `

            <div class="card">

                <h3>${denuncia.local}</h3>

                <p><strong>Data:</strong> ${denuncia.data}</p>

                <p><strong>Gravidade:</strong> ${denuncia.gravidade}</p>

                <p><strong>Descrição:</strong> ${denuncia.descricao}</p>

                <p><strong>Status:</strong> ${denuncia.status}</p>

                <div class="botoes">

                    <button
                        class="confirmar"
                        onclick="confirmarFogo(${denuncia.id})">

                        Confirmar Fogo

                    </button>

                    <button
                        class="falso"
                        onclick="alarmeFalso(${denuncia.id})">

                        Alarme Falso

                    </button>

                </div>

            </div>

        `;

    });

}

async function confirmarFogo(id){

    await fetch(`${API}/${id}`,{

        method:"PATCH",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            status:"Fogo Confirmado"

        })

    });

    carregarDenuncias();

}

async function alarmeFalso(id){

    await fetch(`${API}/${id}`,{

        method:"PATCH",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            status:"Alarme Falso"

        })

    });

    carregarDenuncias();

}

carregarDenuncias();
let mensagens = [];

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", carregarArquivo);

function carregarArquivo(event){

    const arquivo = event.target.files[0];

    const reader = new FileReader();

    reader.onload = function(e){

        mensagens = [];

        const texto = e.target.result;

        const linhas = texto.split("\n");

        const regex =
        /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})\s+-\s+(.*?):\s+(.*)$/;

        for(const linha of linhas){

            const match = linha.match(regex);

            if(!match) continue;

            const dia = match[1];
            const mes = match[2];
            const ano = match[3].length === 2
                ? "20" + match[3]
                : match[3];

            const hora = match[4];
            const minuto = match[5];

            const autor = match[6];

            const dataObj = new Date(
                `${ano}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}T${hora.padStart(2,"0")}:${minuto}`
            );

            mensagens.push({
                data: dataObj,
                autor
            });
        }

        if(mensagens.length === 0){
            alert("Nenhuma mensagem encontrada.");
            return;
        }

        mensagens.sort((a,b)=>a.data-b.data);

        const primeira = mensagens[0].data;
        const ultima = mensagens[mensagens.length-1].data;

        document.getElementById("periodo").innerText =
        `Mensagens de ${primeira.toLocaleString()} até ${ultima.toLocaleString()}`;

    };

    reader.readAsText(arquivo);
}

document.getElementById("analisarBtn")
.addEventListener("click", analisar);

function analisar(){

    if(mensagens.length === 0){
        alert("Carregue um arquivo primeiro.");
        return;
    }

    const inicioValor = document.getElementById("inicio").value;
    const fimValor = document.getElementById("fim").value;

    if(!inicioValor || !fimValor){
        alert("Selecione as datas.");
        return;
    }

    const inicio = new Date(inicioValor);
    const fim = new Date(fimValor);

    fim.setHours(23,59,59,999);

    const filtradas = mensagens.filter(
        m => m.data >= inicio && m.data <= fim
    );

    const diasPeriodo =
    Math.floor((fim-inicio)/(1000*60*60*24))+1;

    const membros = {};

    for(const msg of filtradas){

        if(!membros[msg.autor]){
            membros[msg.autor] = {
                total:0,
                porDia:{},
                porHora:{}
            };
        }

        membros[msg.autor].total++;

        const dia = msg.data.toISOString().split("T")[0];

        membros[msg.autor].porDia[dia] =
        (membros[msg.autor].porDia[dia] || 0) + 1;

        const hora = msg.data.getHours();

        membros[msg.autor].porHora[hora] =
        (membros[msg.autor].porHora[hora] || 0) + 1;
    }

    let html = "";

    html += `
    <h2>Resumo</h2>

    <table>
        <tr>
            <th>Membro</th>
            <th>Total</th>
            <th>Média diária</th>
        </tr>
    `;

    for(const nome in membros){

        const media =
        (membros[nome].total/diasPeriodo)
        .toFixed(2);

        html += `
        <tr>
            <td>${nome}</td>
            <td>${membros[nome].total}</td>
            <td>${media}</td>
        </tr>
        `;
    }

    html += "</table>";

    for(const nome in membros){

        const membro = membros[nome];

        let horarioPico = "-";
        let maior = 0;

        for(const hora in membro.porHora){

            if(membro.porHora[hora] > maior){
                maior = membro.porHora[hora];
                horarioPico = hora + "h";
            }
        }

        html += `
        <div class="member">
            <h3>${nome}</h3>
            <p>Total: ${membro.total}</p>
            <p>Média diária: ${(membro.total/diasPeriodo).toFixed(2)}</p>
            <p>Horário de pico: ${horarioPico}</p>

            <table>
                <tr>
                    <th>Data</th>
                    <th>Mensagens</th>
                </tr>
        `;

        const dias =
        Object.keys(membro.porDia).sort();

        for(const dia of dias){

            html += `
            <tr>
                <td>${dia}</td>
                <td>${membro.porDia[dia]}</td>
            </tr>
            `;
        }

        html += `
            </table>
        </div>
        `;
    }

    document.getElementById("resultado").innerHTML = html;
}

let allMessages = [];

const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");

const periodSection =
    document.getElementById("periodSection");

const conversationRange =
    document.getElementById("conversationRange");

const startDate =
    document.getElementById("startDate");

const endDate =
    document.getElementById("endDate");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const summarySection =
    document.getElementById("summarySection");

const membersSection =
    document.getElementById("membersSection");

const memberDetails =
    document.getElementById("memberDetails");

const memberSearch =
    document.getElementById("memberSearch");

fileInput.addEventListener(
    "change",
    handleFileUpload
);

async function handleFileUpload(event){

    const file = event.target.files[0];

    if(!file) return;

    fileInfo.innerHTML =
        `<div class="loading">Carregando...</div>`;

    try{

        let text;

        if(file.name.toLowerCase().endsWith(".txt")){

            text = await file.text();

        }else if(
            file.name.toLowerCase().endsWith(".zip")
        ){

            text = await extractTxtFromZip(file);

        }else{

            throw new Error(
                "Formato não suportado."
            );

        }

        processChat(text);

    }catch(error){

        fileInfo.innerHTML = `
        <div class="error">
            ${error.message}
        </div>
        `;

        console.error(error);

    }

}

async function extractTxtFromZip(file){

    const zip =
        await JSZip.loadAsync(file);

    let txtFile = null;

    Object.keys(zip.files).forEach(name=>{

        if(
            name.toLowerCase().endsWith(".txt")
        ){
            txtFile = zip.files[name];
        }

    });

    if(!txtFile){

        throw new Error(
            "Nenhum arquivo TXT encontrado no ZIP."
        );

    }

    return await txtFile.async("string");

}

function processChat(text){

    allMessages = [];

    const lines = text.split("\n");

    const regex =
/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s(\d{1,2}):(\d{2})\s-\s([^:]+):\s([\s\S]*)$/;

    for(const line of lines){

        const match = line.match(regex);

        if(!match) continue;

        let [
            _,
            day,
            month,
            year,
            hour,
            minute,
            author,
            message
        ] = match;

        if(year.length === 2){

            year = "20" + year;

        }

        const date = new Date(
            Number(year),
            Number(month)-1,
            Number(day),
            Number(hour),
            Number(minute)
        );

        allMessages.push({

            date,
            author: author.trim(),
            message

        });

    }

    if(allMessages.length === 0){

        throw new Error(
            "Nenhuma mensagem válida encontrada."
        );

    }

    allMessages.sort(
        (a,b)=>a.date-b.date
    );

    showConversationInfo();

}

function showConversationInfo(){

    const first =
        allMessages[0].date;

    const last =
        allMessages[
            allMessages.length - 1
        ].date;

    const participants =
        new Set(
            allMessages.map(
                m=>m.author
            )
        );

    fileInfo.innerHTML = `
        <div class="success">
            Arquivo carregado com sucesso
        </div>
    `;

    conversationRange.innerHTML = `
        <strong>Mensagens de:</strong>
        ${first.toLocaleString("pt-BR")}
        <br><br>
        <strong>Até:</strong>
        ${last.toLocaleString("pt-BR")}
        <br><br>
        <strong>Total:</strong>
        ${allMessages.length.toLocaleString("pt-BR")}
        mensagens
        <br>
        <strong>Participantes:</strong>
        ${participants.size}
    `;

    startDate.value =
        first.toISOString().split("T")[0];

    endDate.value =
        last.toISOString().split("T")[0];

    periodSection.classList.remove(
        "hidden"
    );

}

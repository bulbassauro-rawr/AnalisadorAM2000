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

const membersTableBody =
    document.querySelector(
        "#membersTable tbody"
    );

const detailsContainer =
    document.getElementById(
        "detailsContainer"
    );

let currentStats = {};

analyzeBtn.addEventListener(
    "click",
    analyzeMessages
);

memberSearch.addEventListener(
    "input",
    renderMembersTable
);

function analyzeMessages(){

    const start =
        new Date(startDate.value);

    const end =
        new Date(endDate.value);

    end.setHours(
        23,
        59,
        59,
        999
    );

    const filtered =
        allMessages.filter(msg =>
            msg.date >= start &&
            msg.date <= end
        );

    const totalDays =
        Math.max(
            1,
            Math.floor(
                (end-start) /
                (1000*60*60*24)
            ) + 1
        );

    currentStats = {};

    filtered.forEach(msg=>{

        if(!currentStats[msg.author]){

            currentStats[msg.author] = {

                total:0,

                first:msg.date,

                last:msg.date,

                byDay:{},

                byHour:{},

                byWeekday:{}

            };

        }

        const data =
            currentStats[msg.author];

        data.total++;

        if(msg.date < data.first)
            data.first = msg.date;

        if(msg.date > data.last)
            data.last = msg.date;

        const dayKey =
            msg.date
            .toISOString()
            .split("T")[0];

        data.byDay[dayKey] =
            (data.byDay[dayKey] || 0) + 1;

        const hour =
            msg.date.getHours();

        data.byHour[hour] =
            (data.byHour[hour] || 0) + 1;

        const weekday =
            msg.date.toLocaleDateString(
                "pt-BR",
                {
                    weekday:"long"
                }
            );

        data.byWeekday[weekday] =
            (data.byWeekday[weekday] || 0) + 1;

    });

    updateSummary(
        filtered,
        totalDays
    );

    renderMembersTable();

    renderMemberCards(
        totalDays
    );

}

function updateSummary(
    filtered,
    totalDays
){

    document.getElementById(
        "totalMessages"
    ).textContent =
        filtered.length
        .toLocaleString("pt-BR");

    document.getElementById(
        "totalMembers"
    ).textContent =
        Object.keys(
            currentStats
        ).length;

    document.getElementById(
        "totalDays"
    ).textContent =
        totalDays;

    summarySection.classList.remove(
        "hidden"
    );

    membersSection.classList.remove(
        "hidden"
    );

    memberDetails.classList.remove(
        "hidden"
    );

}

function renderMembersTable(){

    const search =
        memberSearch.value
        .toLowerCase();

    membersTableBody.innerHTML = "";

    const members =
        Object.entries(
            currentStats
        )
        .filter(([name])=>
            name
            .toLowerCase()
            .includes(search)
        )
        .sort(
            (a,b)=>
            b[1].total -
            a[1].total
        );

    members.forEach(
        ([name,data])=>{

        const activeDays =
            Object.keys(
                data.byDay
            ).length;

        const avg =
            (
                data.total /
                Math.max(
                    activeDays,
                    1
                )
            ).toFixed(2);

        membersTableBody.innerHTML += `
        <tr>
            <td>${name}</td>
            <td>${data.total}</td>
            <td>${avg}</td>
        </tr>
        `;

    });

}

function renderMemberCards(){

    detailsContainer.innerHTML = "";

    const names =
        Object.keys(
            currentStats
        ).sort();

    names.forEach(name=>{

        const data =
            currentStats[name];

        let peakHour = "-";
        let peakCount = 0;

        Object.entries(
            data.byHour
        ).forEach(
            ([hour,count])=>{

            if(count > peakCount){

                peakCount = count;
                peakHour = `${hour}h`;

            }

        });

        let bestDay = "-";
        let bestDayCount = 0;

        Object.entries(
            data.byDay
        ).forEach(
            ([day,count])=>{

            if(count > bestDayCount){

                bestDayCount = count;
                bestDay = day;

            }

        });

        const dailyRows =
            Object.entries(
                data.byDay
            )
            .sort()
            .map(
                ([day,count])=>
                `
                <tr>
                    <td>${day}</td>
                    <td>${count}</td>
                </tr>
                `
            )
            .join("");

        const weekdays =
            Object.entries(
                data.byWeekday
            )
            .map(
                ([day,count])=>
                `<span class="tag">
                    ${day}: ${count}
                </span>`
            )
            .join("");

        const topHours =
            Object.entries(
                data.byHour
            )
            .sort(
                (a,b)=>
                b[1]-a[1]
            )
            .slice(0,5)
            .map(
                ([hour,count])=>
                `<span class="tag">
                    ${hour}h: ${count}
                </span>`
            )
            .join("");

        detailsContainer.innerHTML += `
        <div class="member-card">

            <h3>${name}</h3>

            <div class="member-stats">

                <div class="stat-box">
                    Total
                    <span>
                    ${data.total}
                    </span>
                </div>

                <div class="stat-box">
                    Pico
                    <span>
                    ${peakHour}
                    </span>
                </div>

                <div class="stat-box">
                    Melhor dia
                    <span>
                    ${bestDayCount}
                    </span>
                </div>

            </div>

            <p>
            Primeira:
            ${data.first.toLocaleString(
                "pt-BR"
            )}
            </p>

            <p>
            Última:
            ${data.last.toLocaleString(
                "pt-BR"
            )}
            </p>

            <br>

            <strong>
            Dias da semana
            </strong>

            <br><br>

            ${weekdays}

            <br><br>

            <strong>
            Top horários
            </strong>

            <br><br>

            ${topHours}

            <table>

                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Mensagens</th>
                    </tr>
                </thead>

                <tbody>
                    ${dailyRows}
                </tbody>

            </table>

        </div>
        `;

    });

}

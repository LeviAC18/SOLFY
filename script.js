/**
 * SOLFY 2.0 - ARQUITETURA DE RENDERIZAÇÃO, NOTAÇÃO E REPRODUÇÃO
 * Motor OSMD (OpenSheetMusicDisplay) + Agrupamento Rítmico + Metrônomo por Métrica + Exportação Avançada
 */

// ==========================================
// 1. ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
const State = {
    config: {},
    exercise: null,          // Objeto estruturado como ÚNICA FONTE DE VERDADE
    osmd: null,              // Instância do OpenSheetMusicDisplay
    audioContext: null,
    isPlaying: false,
    playbackId: 0,           // Token incremental para cancelamento estrito de áudio/timers
    scheduledEvents: [],     // IDs de setTimeout agendados
    activeAudioNodes: [],    // Nós ativos de Web Audio API para stop imediato
    resizeTimeout: null,
    currentTitle: "Exercício de Leitura Musical"
};

// ==========================================
// 2. CONSTANTES E DICIONÁRIOS MUSICAIS
// ==========================================
const DURATION_MAP = {
    "4": { sixteenths: 16 },
    "2": { sixteenths: 8 },
    "1": { sixteenths: 4 },
    "0.5": { sixteenths: 2 },
    "0.25": { sixteenths: 1 }
};

const KEY_DIATONIC_SCALES = {
    "C":  ["C", "D", "E", "F", "G", "A", "B"],
    "G":  ["G", "A", "B", "C", "D", "E", "F#"],
    "D":  ["D", "E", "F#", "G", "A", "B", "C#"],
    "A":  ["A", "B", "C#", "D", "E", "F#", "G#"],
    "E":  ["E", "F#", "G#", "A", "B", "C#", "D#"],
    "B":  ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    "F#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
    "C#": ["C#", "D#", "E#", "F#", "G#", "A#", "B#"],
    "F":  ["F", "G", "A", "Bb", "C", "D", "E"],
    "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
    "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"]
};

const HARMONIC_PROGRESSIONS = {
    very_easy: [
        ["I", "I", "V", "I"],
        ["I", "IV", "V", "I"]
    ],
    easy: [
        ["I", "IV", "V", "I"],
        ["I", "vi", "IV", "V"],
        ["I", "ii", "V", "I"]
    ],
    intermediate: [
        ["I", "vi", "IV", "V"],
        ["I", "iii", "vi", "V"],
        ["vi", "ii", "V", "I"],
        ["I", "IV", "ii", "V"]
    ],
    advanced: [
        ["I", "iii", "vi", "ii", "V", "I"],
        ["I", "IV", "ii", "V", "I"],
        ["I", "V/IV", "IV", "V", "I"]
    ],
    very_advanced: [
        ["I", "iii", "vi", "ii", "V", "I"],
        ["vi", "ii", "V", "I", "IV", "V", "I"],
        ["I", "V/V", "V", "I", "IV", "V", "I"]
    ]
};

// ==========================================
// 3. INICIALIZAÇÃO DA INTERFACE & EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    bindUIEvents();
    updateClefUI();
    generateAndRenderScore();

    window.addEventListener('resize', () => {
        clearTimeout(State.resizeTimeout);
        State.resizeTimeout = setTimeout(() => {
            if (State.osmd) {
                State.osmd.render();
            }
        }, 250);
    });
});

function bindUIEvents() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleMobileMenu(open) {
        if (open) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    mobileBtn?.addEventListener('click', () => toggleMobileMenu(true));
    closeBtn?.addEventListener('click', () => toggleMobileMenu(false));
    overlay?.addEventListener('click', () => toggleMobileMenu(false));

    const toggleBtn = document.getElementById('toggle-sidebar');
    toggleBtn?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleBtn.innerHTML = sidebar.classList.contains('collapsed') ? '☰ Mostrar Menu' : '☰ Ocultar Menu';
        setTimeout(() => {
            if (State.osmd) State.osmd.render();
        }, 300);
    });

    document.querySelectorAll('input[name="clef"]').forEach(radio => {
        radio.addEventListener('change', updateClefUI);
    });

    document.getElementById('btn-generate')?.addEventListener('click', () => {
        toggleMobileMenu(false);
        generateAndRenderScore();
    });
    document.getElementById('btn-new')?.addEventListener('click', () => generateAndRenderScore());

    document.getElementById('btn-play')?.addEventListener('click', playAudio);
    document.getElementById('btn-stop')?.addEventListener('click', stopAudio);
    document.getElementById('btn-repeat')?.addEventListener('click', playAudio);

    // SLIDERS DE VOLUME COM ATUALIZAÇÃO EM TEMPO REAL
    const pianoSlider = document.getElementById('volume-piano');
    const metronomeSlider = document.getElementById('volume-metronome');

    pianoSlider?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        State.config.volumePiano = val;
        document.getElementById('vol-piano-val').textContent = `${Math.round(val * 100)}%`;
    });

    metronomeSlider?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        State.config.volumeMetronome = val;
        document.getElementById('vol-metronome-val').textContent = `${Math.round(val * 100)}%`;
    });

    // DROPDOWN DE EXPORTAÇÃO E MODAL
    const openExportBtn = document.getElementById('btn-open-export-modal');
    const exportMenu = document.getElementById('export-menu');
    openExportBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        exportMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => exportMenu?.classList.add('hidden'));

    document.getElementById('btn-menu-export-pdf')?.addEventListener('click', () => openExportModal('pdf'));
    document.getElementById('btn-menu-export-jpeg')?.addEventListener('click', () => openExportModal('jpeg'));
    document.getElementById('btn-export-audio')?.addEventListener('click', exportAudioWAV);

    // CONTROLES DO MODAL DE EXPORTAÇÃO
    document.getElementById('btn-close-export-modal')?.addEventListener('click', closeExportModal);
    document.getElementById('btn-cancel-export')?.addEventListener('click', closeExportModal);
    document.getElementById('btn-confirm-export')?.addEventListener('click', processModalExport);

    document.querySelectorAll('input[name="export-format"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const jpegGroup = document.getElementById('jpeg-res-group');
            if (e.target.value === 'jpeg') {
                jpegGroup.classList.remove('hidden');
            } else {
                jpegGroup.classList.add('hidden');
            }
        });
    });
}

function updateClefUI() {
    const clef = document.querySelector('input[name="clef"]:checked').value;
    const solOct = document.getElementById('octaves-sol');
    const faOct = document.getElementById('octaves-fa');

    if (clef === 'sol') {
        solOct.classList.remove('hidden');
        faOct.classList.add('hidden');
    } else {
        solOct.classList.add('hidden');
        faOct.classList.remove('hidden');
    }
}

function showError(msg) {
    const errDiv = document.getElementById('error-message');
    if (msg) {
        errDiv.textContent = msg;
        errDiv.classList.remove('hidden');
    } else {
        errDiv.classList.add('hidden');
    }
}

function setLoading(isLoading, text = "Processando exercício...") {
    const btn = document.getElementById('btn-generate');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    if (isLoading) {
        btn.querySelector('.btn-text').textContent = "GERANDO...";
        btn.querySelector('.spinner').classList.remove('hidden');
        loadingText.textContent = text;
        loadingOverlay.classList.remove('hidden');
    } else {
        btn.querySelector('.btn-text').textContent = "GERAR PARTITURA";
        btn.querySelector('.spinner').classList.add('hidden');
        loadingOverlay.classList.add('hidden');
    }
}

function getConfig() {
    const clef = document.querySelector('input[name="clef"]:checked').value;
    const octavesCb = document.querySelectorAll(`#octaves-${clef} .octave-cb:checked`);
    
    return {
        clef: clef,
        difficulty: document.getElementById('difficulty').value,
        octaves: Array.from(octavesCb).map(cb => cb.value),
        notes: Array.from(document.querySelectorAll('.note-cb:checked')).map(cb => cb.value),
        rhythms: Array.from(document.querySelectorAll('.rhythm-cb:checked')).map(cb => cb.value),
        rests: Array.from(document.querySelectorAll('.rest-cb:checked')).map(cb => cb.value),
        key: document.getElementById('key-signature').value,
        timeSignature: document.getElementById('time-signature').value,
        measures: parseInt(document.getElementById('measure-count').value),
        bpm: parseInt(document.getElementById('bpm').value),
        useMetronome: document.getElementById('use-metronome').checked,
        countIn: parseInt(document.getElementById('count-in').value),
        volumePiano: parseFloat(document.getElementById('volume-piano').value),
        volumeMetronome: parseFloat(document.getElementById('volume-metronome').value)
    };
}

// ==========================================
// 4. MOTOR MUSICAL PROCEDURAL
// ==========================================

class HarmonicGenerator {
    static generatePlan(config) {
        const key = config.key;
        const totalMeasures = config.measures;
        const scale = KEY_DIATONIC_SCALES[key] || KEY_DIATONIC_SCALES["C"];
        const difficulty = config.difficulty;

        const options = HARMONIC_PROGRESSIONS[difficulty] || HARMONIC_PROGRESSIONS["easy"];
        const chosenProgression = options[Math.floor(Math.random() * options.length)];

        let harmonicPlan = [];
        for (let i = 0; i < totalMeasures; i++) {
            let degreeSymbol;
            if (i === totalMeasures - 2) degreeSymbol = "V";
            else if (i === totalMeasures - 1) degreeSymbol = "I";
            else degreeSymbol = chosenProgression[i % chosenProgression.length];

            let chordTones = this.getChordTones(degreeSymbol, scale);
            harmonicPlan.push({
                measureIndex: i,
                degree: degreeSymbol,
                chordTones: chordTones
            });
        }
        return harmonicPlan;
    }

    static getChordTones(degreeSymbol, scale) {
        let rootIdx = 0;
        switch(degreeSymbol) {
            case "I": rootIdx = 0; break;
            case "ii": rootIdx = 1; break;
            case "iii": rootIdx = 2; break;
            case "IV": rootIdx = 3; break;
            case "V": rootIdx = 4; break;
            case "vi": rootIdx = 5; break;
            case "V/IV": rootIdx = 0; break;
            case "V/V": rootIdx = 1; break;
            default: rootIdx = 0;
        }

        return [
            scale[rootIdx % 7],
            scale[(rootIdx + 2) % 7],
            scale[(rootIdx + 4) % 7]
        ];
    }
}

class RhythmicGenerator {
    static generatePlan(config) {
        const [beatsStr] = config.timeSignature.split('/');
        const beatsPerMeasure = parseInt(beatsStr);
        const maxSixteenths = beatsPerMeasure * 4;
        const totalMeasures = config.measures;

        let allowedRhythms = config.rhythms.length > 0 ? config.rhythms : ["1"];
        
        if (config.difficulty === 'very_easy') {
            allowedRhythms = allowedRhythms.filter(r => r === "4" || r === "2" || r === "1");
            if (allowedRhythms.length === 0) allowedRhythms = ["1"];
        }

        let rhythmicPlan = [];

        for (let m = 0; m < totalMeasures; m++) {
            let currentSixteenths = 0;
            let measureRhythms = [];

            while (currentSixteenths < maxSixteenths) {
                let spaceLeft = maxSixteenths - currentSixteenths;
                let candidates = allowedRhythms.filter(r => DURATION_MAP[r].sixteenths <= spaceLeft);

                if (candidates.length === 0) candidates = ["0.25"];

                let chosenKey = candidates[Math.floor(Math.random() * candidates.length)];
                let durObj = DURATION_MAP[chosenKey];

                let isRest = config.rests.includes(chosenKey) && (Math.random() < 0.2) && (config.difficulty !== 'very_easy');

                measureRhythms.push({
                    durationKey: chosenKey,
                    sixteenths: durObj.sixteenths,
                    isRest: isRest,
                    beatPosition: (currentSixteenths / 4) + 1
                });

                currentSixteenths += durObj.sixteenths;
            }
            rhythmicPlan.push(measureRhythms);
        }
        return rhythmicPlan;
    }
}

class MelodicGenerator {
    static generateExercise(config, harmonicPlan, rhythmicPlan) {
        const key = config.key;
        const scaleLetters = KEY_DIATONIC_SCALES[key] || KEY_DIATONIC_SCALES["C"];
        let allowedLetters = config.notes.length > 0 ? config.notes : scaleLetters;
        
        const pitchPool = [];
        let octaves = config.octaves.length > 0 ? config.octaves : ["4"];
        
        octaves.forEach(oct => {
            allowedLetters.forEach(letter => {
                pitchPool.push({
                    letter: letter,
                    octave: oct,
                    midi: this.noteToMidi(letter, oct)
                });
            });
        });

        pitchPool.sort((a, b) => a.midi - b.midi);

        let exercise = {
            title: State.currentTitle || "Exercício de Leitura Musical",
            key: key,
            timeSignature: config.timeSignature,
            bpm: config.bpm,
            clef: config.clef,
            difficulty: config.difficulty,
            measures: []
        };

        let previousPitch = pitchPool[Math.floor(pitchPool.length / 2)] || pitchPool[0];

        for (let m = 0; m < config.measures; m++) {
            const harmony = harmonicPlan[m];
            const rhythmMeasure = rhythmicPlan[m];
            let measureNotes = [];

            for (let r = 0; r < rhythmMeasure.length; r++) {
                const rhythmItem = rhythmMeasure[r];

                if (rhythmItem.isRest) {
                    measureNotes.push({
                        isRest: true,
                        durationSixteenths: rhythmItem.sixteenths,
                        beat: rhythmItem.beatPosition
                    });
                } else {
                    let bestPitch = this.selectBestPitch(pitchPool, previousPitch, harmony, rhythmItem, config.difficulty);
                    previousPitch = bestPitch;

                    measureNotes.push({
                        isRest: false,
                        pitch: bestPitch.letter,
                        octave: bestPitch.octave,
                        durationSixteenths: rhythmItem.sixteenths,
                        beat: rhythmItem.beatPosition,
                        midi: bestPitch.midi
                    });
                }
            }

            exercise.measures.push({
                measureIndex: m,
                harmony: harmony.degree,
                notes: measureNotes
            });
        }

        return exercise;
    }

    static selectBestPitch(pitchPool, prevPitch, harmony, rhythmItem, difficulty) {
        const isStrongBeat = (rhythmItem.beatPosition % 1 === 0) && (rhythmItem.beatPosition === 1 || rhythmItem.beatPosition === 3);

        let candidates = pitchPool.map(p => {
            let score = 0;
            let interval = Math.abs(p.midi - prevPitch.midi);

            if (interval === 0) score += 2;
            else if (interval <= 2) score += 10;
            else if (interval <= 4) score += 5;
            else if (interval <= 7) score += (difficulty === 'very_easy' ? -10 : 2);
            else score -= 8;

            let isChordTone = harmony.chordTones.includes(p.letter);
            if (isStrongBeat) {
                if (isChordTone) score += 8;
                else score -= 4;
            } else {
                if (isChordTone) score += 3;
                else score += 4;
            }

            return { pitch: p, score: score };
        });

        candidates.sort((a, b) => b.score - a.score);
        let topCandidates = candidates.slice(0, 3);
        return topCandidates[Math.floor(Math.random() * topCandidates.length)].pitch;
    }

    static noteToMidi(letter, octave) {
        const offsets = { "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11, "B#": 12 };
        let oct = parseInt(octave);
        return (oct + 1) * 12 + (offsets[letter] || 0);
    }
}

// ==========================================
// 5. ADAPTADOR MUSICXML COM LIGADURA/BEAMING NATIVO
// ==========================================

class ExerciseToMusicXMLAdapter {
    static convert(exercise) {
        const keyFifthsMap = {
            "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
            "F": -1, "Bb": -2, "Eb": -3, "Ab": -4
        };
        const fifths = keyFifthsMap[exercise.key] ?? 0;
        const [beats, beatType] = exercise.timeSignature.split('/').map(Number);
        const clefSign = exercise.clef === 'sol' ? 'G' : 'F';
        const clefLine = exercise.clef === 'sol' ? 2 : 4;

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n`;
        xml += `<score-partwise version="3.1">\n`;
        xml += `  <work><work-title>${exercise.title || 'Exercício de Leitura Musical'}</work-title></work>\n`;
        xml += `  <part-list>\n`;
        xml += `    <score-part id="P1"><part-name>Solfy</part-name></score-part>\n`;
        xml += `  </part-list>\n`;
        xml += `  <part id="P1">\n`;

        exercise.measures.forEach((m, mIdx) => {
            xml += `    <measure number="${mIdx + 1}">\n`;
            if (mIdx === 0) {
                xml += `      <attributes>\n`;
                xml += `        <divisions>4</divisions>\n`;
                xml += `        <key><fifths>${fifths}</fifths></key>\n`;
                xml += `        <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>\n`;
                xml += `        <clef><sign>${clefSign}</sign><line>${clefLine}</line></clef>\n`;
                xml += `      </attributes>\n`;
                xml += `      <sound tempo="${exercise.bpm}"/>\n`;
            }

            // Cálculo do Agrupamento Rítmico de Barras (Beams) segundo Notação Convencional
            const beamsInfo = this.calculateBeams(m.notes, exercise.timeSignature);

            m.notes.forEach((note, noteIdx) => {
                xml += `      <note>\n`;
                if (note.isRest) {
                    xml += `        <rest/>\n`;
                } else {
                    let step = note.pitch.charAt(0).toUpperCase();
                    let accidental = note.pitch.slice(1);
                    let alter = 0;
                    if (accidental === '#') alter = 1;
                    else if (accidental === 'b') alter = -1;

                    xml += `        <pitch>\n`;
                    xml += `          <step>${step}</step>\n`;
                    if (alter !== 0) xml += `          <alter>${alter}</alter>\n`;
                    xml += `          <octave>${note.octave}</octave>\n`;
                    xml += `        </pitch>\n`;
                }
                xml += `        <duration>${note.durationSixteenths}</duration>\n`;
                
                let type = "quarter";
                if (note.durationSixteenths === 16) type = "whole";
                else if (note.durationSixteenths === 8) type = "half";
                else if (note.durationSixteenths === 4) type = "quarter";
                else if (note.durationSixteenths === 2) type = "eighth";
                else if (note.durationSixteenths === 1) type = "16th";
                
                xml += `        <type>${type}</type>\n`;

                // Inserir barras de ligação (beams) para colcheias e semicolcheias
                if (!note.isRest && beamsInfo[noteIdx]) {
                    const info = beamsInfo[noteIdx];
                    if (info.beam1) {
                        xml += `        <beam number="1">${info.beam1}</beam>\n`;
                    }
                    if (info.beam2) {
                        xml += `        <beam number="2">${info.beam2}</beam>\n`;
                    }
                }

                xml += `      </note>\n`;
            });

            xml += `    </measure>\n`;
        });

        xml += `  </part>\n`;
        xml += `</score-partwise>`;
        return xml;
    }

    /**
     * Calcula o agrupamento métrico correto (Beaming) respeitando:
     * - Divisão do tempo/fórmula de compasso (ex: 4/4 divide por pulso de semínima)
     * - Pausas interrompem o agrupamento
     * - Não agrupa através da barra de compasso
     */
    static calculateBeams(notes, timeSignature) {
        const [beatsStr, beatTypeStr] = timeSignature.split('/');
        const beatType = parseInt(beatTypeStr);
        const sixteenthsPerBeat = 16 / beatType;

        let currentSixteenth = 0;
        const noteRanges = notes.map(n => {
            let start = currentSixteenth;
            let duration = n.durationSixteenths;
            currentSixteenth += duration;
            return { start, duration, isRest: n.isRest };
        });

        const beamInfo = notes.map(() => ({ beam1: null, beam2: null }));
        let currentGroup = [];

        function processGroup(group) {
            if (group.length < 2) return;
            for (let i = 0; i < group.length; i++) {
                let idx = group[i];
                let isFirst = (i === 0);
                let isLast = (i === group.length - 1);
                beamInfo[idx].beam1 = isFirst ? 'begin' : (isLast ? 'end' : 'continue');
            }

            // Agrupamento secundário para semicolcheias (Beam 2)
            let sixteenthGroup = [];
            function process16thGroup(sGroup) {
                if (sGroup.length < 2) return;
                for (let j = 0; j < sGroup.length; j++) {
                    let idx = sGroup[j];
                    let isFirst = (j === 0);
                    let isLast = (j === sGroup.length - 1);
                    beamInfo[idx].beam2 = isFirst ? 'begin' : (isLast ? 'end' : 'continue');
                }
            }

            for (let i = 0; i < group.length; i++) {
                let idx = group[i];
                if (notes[idx].durationSixteenths === 1) {
                    sixteenthGroup.push(idx);
                } else {
                    process16thGroup(sixteenthGroup);
                    sixteenthGroup = [];
                }
            }
            process16thGroup(sixteenthGroup);
        }

        for (let i = 0; i < noteRanges.length; i++) {
            let nr = noteRanges[i];
            let isBeamable = !nr.isRest && nr.duration <= 2; // Apenas colcheias e semicolcheias

            if (!isBeamable) {
                processGroup(currentGroup);
                currentGroup = [];
                continue;
            }

            if (currentGroup.length > 0) {
                let prevIdx = currentGroup[currentGroup.length - 1];
                let prevNr = noteRanges[prevIdx];
                let prevBeat = Math.floor(prevNr.start / sixteenthsPerBeat);
                let currBeat = Math.floor(nr.start / sixteenthsPerBeat);

                // Romper o agrupamento se mudar de tempo do compasso (subdivisão métrica)
                if (currBeat !== prevBeat) {
                    processGroup(currentGroup);
                    currentGroup = [];
                }
            }

            currentGroup.push(i);
        }
        processGroup(currentGroup);

        return beamInfo;
    }
}

// ==========================================
// 6. PIPELINE DE COMPOSIÇÃO E RENDERIZAÇÃO OSMD
// ==========================================

function generateAndRenderScore() {
    stopAudio();
    showError(null);
    setLoading(true, "Compondo e renderizando partitura...");

    setTimeout(() => {
        try {
            State.config = getConfig();
            const harmonicPlan = HarmonicGenerator.generatePlan(State.config);
            const rhythmicPlan = RhythmicGenerator.generatePlan(State.config);
            
            State.exercise = MelodicGenerator.generateExercise(State.config, harmonicPlan, rhythmicPlan);

            updateScoreHeaderDisplay();
            renderScoreFromExercise();

        } catch (e) {
            console.error("Erro na pipeline musical:", e);
            showError("Ocorreu um erro ao gerar a partitura. Tente recalibrar as opções.");
        } finally {
            setLoading(false);
        }
    }, 80);
}

function updateScoreHeaderDisplay() {
    const keySelect = document.getElementById('key-signature');
    const diffSelect = document.getElementById('difficulty');
    
    // Atualizar badge superior
    document.getElementById('score-info').innerHTML = `
        <span>🎵 ${keySelect.options[keySelect.selectedIndex].text}</span>
        <span>🎯 ${diffSelect.options[diffSelect.selectedIndex].text.split(' ')[0]}</span>
        <span>⏱ ${State.config.timeSignature}</span>
        <span>🎚 ${State.config.bpm} BPM</span>
        <span>📏 ${State.config.measures} Comp.</span>
    `;

    // Atualizar título interno e metadados no topo da partitura
    document.getElementById('score-main-title').textContent = State.exercise.title || "Exercício de Leitura Musical";
    document.getElementById('score-metadata-display').textContent = 
        `${keySelect.options[keySelect.selectedIndex].text} • Compasso ${State.config.timeSignature} • BPM ${State.config.bpm} • Clave de ${State.config.clef === 'sol' ? 'Sol' : 'Fá'}`;
}

function renderScoreFromExercise() {
    if (!State.exercise) return;

    try {
        const xmlString = ExerciseToMusicXMLAdapter.convert(State.exercise);
        const targetContainer = document.getElementById('osmd-target-container');
        targetContainer.innerHTML = '';

        if (!State.osmd) {
            State.osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmd-target-container", {
                autoResize: true,
                drawTitle: false,
                drawSubtitle: false,
                drawComposer: false,
                drawCredits: false,
                drawPartNames: false,
                renderSingleHorizontalStaff: false
            });
        }

        State.osmd.load(xmlString).then(() => {
            State.osmd.render();
            if (State.osmd.cursor) {
                State.osmd.cursor.hide();
            }
        }).catch(err => {
            console.error("Erro no OpenSheetMusicDisplay:", err);
            showError("Erro na renderização da partitura na tela.");
        });

    } catch (err) {
        console.error("Erro na preparação OSMD:", err);
        showError("Erro ao preparar dados da partitura.");
    }
}

// ==========================================
// 7. SISTEMA DE ÁUDIO & METRÔNOMO MATEMATICAMENTE PRECISO
// ==========================================

function initAudioContext() {
    if (!State.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        State.audioContext = new AudioCtx();
    }
    if (State.audioContext.state === 'suspended') {
        State.audioContext.resume();
    }
}

function stopAudio() {
    State.isPlaying = false;
    State.playbackId++; // Invalida qualquer evento agendado anterior

    // Cancelar todos os timeouts JS
    State.scheduledEvents.forEach(id => clearTimeout(id));
    State.scheduledEvents = [];

    // Interromper imediatamente todos os osciladores/nós de áudio ativos
    State.activeAudioNodes.forEach(node => {
        try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
        } catch (e) {}
    });
    State.activeAudioNodes = [];

    // Ocultar cursor do OSMD
    if (State.osmd && State.osmd.cursor) {
        State.osmd.cursor.hide();
    }
}

function playAudio() {
    if (!State.exercise || !State.osmd) return;
    stopAudio();
    initAudioContext();

    State.isPlaying = true;
    const currentPlaybackId = ++State.playbackId;

    const bpm = State.exercise.bpm;
    const beatDuration = 60 / bpm;
    const [beatsStr] = State.exercise.timeSignature.split('/');
    const beatsPerMeasure = parseInt(beatsStr);

    // Reiniciar Cursor OSMD
    if (State.osmd.cursor) {
        State.osmd.cursor.show();
        State.osmd.cursor.reset();
    }

    let startTime = State.audioContext.currentTime + 0.15;

    // 1. CONTAGEM INICIAL (METRÔNOMO EXATO)
    const countInBeats = State.config.countIn * beatsPerMeasure;
    if (countInBeats > 0) {
        for (let i = 0; i < countInBeats; i++) {
            let clickTime = startTime + (i * beatDuration);
            let isFirstBeatOfCount = (i % beatsPerMeasure === 0);
            scheduleMetronomeClick(clickTime, isFirstBeatOfCount, currentPlaybackId);
        }
        startTime += countInBeats * beatDuration;
    }

    // 2. METRÔNOMO EM TODOS OS TEMPOS (INDEPENDENTE DAS NOTAS)
    const totalMeasures = State.exercise.measures.length;
    if (State.config.useMetronome) {
        for (let m = 0; m < totalMeasures; m++) {
            let measureStartTime = startTime + (m * beatsPerMeasure * beatDuration);
            for (let b = 0; b < beatsPerMeasure; b++) {
                let clickTime = measureStartTime + (b * beatDuration);
                let isAccent = (b === 0); // 1º tempo forte/agudo ("CLACK")
                scheduleMetronomeClick(clickTime, isAccent, currentPlaybackId);
            }
        }
    }

    // 3. REPRODUÇÃO DO PIANO E LINHA DO TEMPO
    let currentTimeOffset = 0;
    let stepCounter = 0;

    State.exercise.measures.forEach((measure) => {
        measure.notes.forEach((note) => {
            let noteDurationSec = (note.durationSixteenths / 4) * beatDuration;
            let noteTime = startTime + currentTimeOffset;

            if (!note.isRest) {
                schedulePianoTone(noteTime, note.midi, noteDurationSec, currentPlaybackId);
            }

            // Sincronização exata da Timeline com o modelo musical
            let currentStep = stepCounter;
            let timeoutMs = (noteTime - State.audioContext.currentTime) * 1000;

            if (timeoutMs >= 0) {
                let timer = setTimeout(() => {
                    if (State.isPlaying && State.playbackId === currentPlaybackId) {
                        advanceTimelineCursor(currentStep);
                    }
                }, timeoutMs);
                State.scheduledEvents.push(timer);
            }

            stepCounter++;
            currentTimeOffset += noteDurationSec;
        });
    });

    // Finalizar reprodução ao término
    let totalDurationMs = (startTime + currentTimeOffset - State.audioContext.currentTime) * 1000;
    let endTimer = setTimeout(() => {
        if (State.playbackId === currentPlaybackId) {
            stopAudio();
        }
    }, totalDurationMs + 200);
    State.scheduledEvents.push(endTimer);
}

function advanceTimelineCursor(stepIndex) {
    if (!State.osmd || !State.osmd.cursor || !State.isPlaying) return;
    
    if (stepIndex === 0) {
        State.osmd.cursor.reset();
    } else {
        State.osmd.cursor.next();
    }
    
    const cursorElement = State.osmd.cursor.cursorElement;
    if (cursorElement) {
        const rect = cursorElement.getBoundingClientRect();
        const scoreContainer = document.getElementById('score-container');
        const containerRect = scoreContainer.getBoundingClientRect();

        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
            scoreContainer.scrollTop += (rect.top - containerRect.top - 60);
        }
    }
}

function schedulePianoTone(time, midiNote, duration, playbackId) {
    if (!State.audioContext || State.playbackId !== playbackId || !State.isPlaying) return;

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const volume = State.config.volumePiano ?? 0.8;
    
    const osc1 = State.audioContext.createOscillator();
    const osc2 = State.audioContext.createOscillator();
    const gainNode = State.audioContext.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2, time);

    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, time + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.001, time + duration + 0.25);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(State.audioContext.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.3);
    osc2.stop(time + duration + 0.3);

    State.activeAudioNodes.push(osc1, osc2, gainNode);
}

function scheduleMetronomeClick(time, isAccent, playbackId) {
    if (!State.audioContext || State.playbackId !== playbackId || !State.isPlaying) return;

    const osc = State.audioContext.createOscillator();
    const gain = State.audioContext.createGain();

    const volume = State.config.volumeMetronome ?? 0.5;

    osc.type = isAccent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time); // 1200 Hz para o tempo 1 (mais agudo/destacado)

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime((isAccent ? 0.7 : 0.4) * volume, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(State.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.07);

    State.activeAudioNodes.push(osc, gain);
}

// ==========================================
// 8. MODAL DE EXPORTAÇÃO PERSONALIZADA
// ==========================================

function openExportModal(defaultFormat = 'pdf') {
    const modal = document.getElementById('export-modal-overlay');
    const titleInput = document.getElementById('export-title-input');
    const jpegGroup = document.getElementById('jpeg-res-group');

    if (State.exercise) {
        titleInput.value = State.exercise.title || "Exercício de Leitura Musical";
    }

    const formatRadio = document.querySelector(`input[name="export-format"][value="${defaultFormat}"]`);
    if (formatRadio) formatRadio.checked = true;

    if (defaultFormat === 'jpeg') {
        jpegGroup.classList.remove('hidden');
    } else {
        jpegGroup.classList.add('hidden');
    }

    modal.classList.add('active');
    modal.classList.remove('hidden');
}

function closeExportModal() {
    const modal = document.getElementById('export-modal-overlay');
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 250);
}

function processModalExport() {
    const customTitle = document.getElementById('export-title-input').value.trim() || "Exercício de Leitura Musical";
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const resPx = parseInt(document.getElementById('export-resolution').value) || 2560;

    // Atualizar título sem alterar o exercício existente
    State.exercise.title = customTitle;
    State.currentTitle = customTitle;
    updateScoreHeaderDisplay();

    closeExportModal();

    if (format === 'pdf') {
        exportPDF(customTitle);
    } else if (format === 'jpeg') {
        exportJPEG(customTitle, resPx);
    }
}

// ==========================================
// 9. EXPORTAÇÃO (PDF, JPEG COM DIVISÃO E WAV)
// ==========================================

function exportPDF(title) {
    const element = document.getElementById('score-paper');
    if (!element) return;

    setLoading(true, "Gerando PDF de alta qualidade...");

    const filename = `${title.replace(/[^a-zA-Z0-9\s-_]/g, '')}.pdf`;

    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        setLoading(false);
    }).catch(err => {
        console.error("Erro PDF:", err);
        setLoading(false);
        showError("Não foi possível salvar o PDF.");
    });
}

function exportJPEG(title, targetWidthPx = 2560) {
    const svgElements = document.querySelectorAll('#osmd-target-container svg');
    if (!svgElements || svgElements.length === 0) {
        showError("Nenhuma partitura encontrada para exportar.");
        return;
    }

    setLoading(true, "Processando imagem JPEG...");

    setTimeout(() => {
        try {
            const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s-_]/g, '');
            const totalMeasures = State.exercise.measures.length;

            // Se o exercício for longo (> 20 compassos), dividir em partes sequenciais sem cortar compassos
            const MAX_MEASURES_PER_IMAGE = 20;
            const needsSplitting = totalMeasures > MAX_MEASURES_PER_IMAGE;

            if (!needsSplitting) {
                renderAndDownloadJPEGChunk(title, document.getElementById('score-paper'), `${sanitizedTitle}.jpg`, targetWidthPx);
            } else {
                const totalParts = Math.ceil(totalMeasures / MAX_MEASURES_PER_IMAGE);
                
                for (let part = 1; part <= totalParts; part++) {
                    const startM = (part - 1) * MAX_MEASURES_PER_IMAGE + 1;
                    const endM = Math.min(part * MAX_MEASURES_PER_IMAGE, totalMeasures);
                    const partTitle = `${title} (Parte ${part} - Compassos ${startM} a ${endM})`;
                    const filename = `${sanitizedTitle}_Parte_${part}.jpg`;

                    renderAndDownloadJPEGChunk(partTitle, document.getElementById('score-paper'), filename, targetWidthPx);
                }
            }
        } catch (err) {
            console.error("Erro no JPEG:", err);
            showError("Erro ao exportar a partitura como JPEG.");
        } finally {
            setLoading(false);
        }
    }, 150);
}

function renderAndDownloadJPEGChunk(chunkTitle, scoreElement, filename, targetWidthPx) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const rect = scoreElement.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    const scale = targetWidthPx / width;
    canvas.width = targetWidthPx;
    canvas.height = height * scale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    const svgDataArr = Array.from(scoreElement.querySelectorAll('svg')).map(svg => {
        return new XMLSerializer().serializeToString(svg);
    });

    // Renderizar conteúdo HTML do quadro da partitura no canvas
    const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="background:#fff; font-family:Poppins, sans-serif; padding:15px;">
                <div style="text-align:center; font-weight:bold; font-size:18px; text-transform:uppercase; margin-bottom:8px;">${chunkTitle}</div>
                ${scoreElement.querySelector('.score-metadata')?.outerHTML || ''}
                <div style="margin-top:15px;">${svgDataArr.join('')}</div>
                <div style="text-align:center; margin-top:20px; font-size:11px; color:#94a3b8; font-style:italic;">Solfy - gerador de exercícios de partitura</div>
            </div>
        </foreignObject>
    </svg>`;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
        const downloadLink = document.createElement('a');
        downloadLink.href = jpegUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    img.src = url;
}

function exportAudioWAV() {
    if (!State.exercise) return;
    setLoading(true, "Renderizando áudio do exercício...");

    setTimeout(() => {
        try {
            const bpm = State.exercise.bpm;
            const beatDuration = 60 / bpm;
            let totalSixteenths = 0;

            State.exercise.measures.forEach(m => {
                m.notes.forEach(n => totalSixteenths += n.durationSixteenths);
            });

            const totalDurationSec = (totalSixteenths / 4) * beatDuration + 1;
            const sampleRate = 44100;

            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, sampleRate * totalDurationSec, sampleRate);

            let currentTimeOffset = 0;
            State.exercise.measures.forEach(measure => {
                measure.notes.forEach(note => {
                    let noteDurationSec = (note.durationSixteenths / 4) * beatDuration;

                    if (!note.isRest) {
                        const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
                        const osc = offlineCtx.createOscillator();
                        const gain = offlineCtx.createGain();

                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, currentTimeOffset);

                        gain.gain.setValueAtTime(0.001, currentTimeOffset);
                        gain.gain.linearRampToValueAtTime(0.6, currentTimeOffset + 0.015);
                        gain.gain.exponentialRampToValueAtTime(0.001, currentTimeOffset + noteDurationSec + 0.2);

                        osc.connect(gain);
                        gain.connect(offlineCtx.destination);

                        osc.start(currentTimeOffset);
                        osc.stop(currentTimeOffset + noteDurationSec + 0.25);
                    }
                    currentTimeOffset += noteDurationSec;
                });
            });

            offlineCtx.startRendering().then(renderedBuffer => {
                const wavBlob = audioBufferToWavBlob(renderedBuffer);
                const url = URL.createObjectURL(wavBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(State.exercise.title || 'Solfy_Exercicio').replace(/[^a-zA-Z0-9\s-_]/g, '')}.wav`;
                a.click();
                setLoading(false);
            });

        } catch (err) {
            console.error("Erro no exportador de áudio:", err);
            setLoading(false);
            showError("Falha ao exportar o arquivo de áudio.");
        }
    }, 100);
}

function audioBufferToWavBlob(buffer) {
    let numOfChan = buffer.numberOfChannels,
        len = buffer.length * numOfChan * 2 + 44,
        out = new DataView(new ArrayBuffer(len)),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952);
    setUint32(len - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(len - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (offset < buffer.length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            out.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }
    return new Blob([out.buffer], { type: "audio/wav" });
}
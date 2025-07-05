// 게임 상태 관리
let currentScreen = 'start';
let selectedAge = '';
let currentGame = '';
let gameScores = {
    memory: 0,
    music: 0,
    quiz: 0
};

// 화면 전환 함수
function showScreen(screenId) {
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 선택된 화면 보이기
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // 게임 화면과 선택 화면일 때 16:10 비율 적용
    if (screenId.includes('-game') || screenId === 'result-screen' || screenId === 'game-selection') {
        document.body.classList.add('game-mode');
    } else {
        document.body.classList.remove('game-mode');
    }
}

// 연령 선택 이벤트
document.addEventListener('DOMContentLoaded', function() {
    // 연령 선택 버튼 이벤트
    document.querySelectorAll('.age-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAge = btn.dataset.age;
            const ageText = selectedAge === 'child' ? '유아용 게임을 선택해주세요' : '노인용 게임을 선택해주세요';
            document.querySelector('.selected-age').textContent = ageText;
            showScreen('game-selection');
        });
    });

    // 게임 선택 버튼 이벤트
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentGame = btn.dataset.game;
            showScreen(`${currentGame}-game`);
            
            // 게임 초기화
            switch(currentGame) {
                case 'memory':
                    initMemoryGame();
                    break;
                case 'music':
                    initMusicGame();
                    break;
                case 'quiz':
                    initQuizGame();
                    break;
            }
        });
    });

    // 음악 게임 시작 버튼 이벤트
    const musicStartBtn = document.getElementById('music-start-btn');
    if (musicStartBtn) {
        musicStartBtn.addEventListener('click', startMusicGame);
    }

    // 초기 화면 표시
    showScreen('start-screen');
});

// 뒤로가기 함수
function goBack() {
    showScreen('start-screen');
}

function goToGameSelection() {
    showScreen('game-selection');
}

// 메모리 카드 게임
let memoryCards = [];
let flippedCards = [];
let matchedPairs = 0;
let wrongAttempts = 0;
let memoryTimer = null;
let memoryTimeLeft = 60;

function initMemoryGame() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    // 카드 쌍 생성 (유아와 노인 모두 8쌍으로 통일)
    const pairs = 8;
    const symbols = ['🐶', '🐱', '🐰', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐷', '🐮', '🐷', '🐔', '🦆', '🦉', '🦋'];
    
    memoryCards = [];
    for (let i = 0; i < pairs; i++) {
        memoryCards.push(symbols[i], symbols[i]);
    }
    
    // 카드 섞기
    memoryCards.sort(() => Math.random() - 0.5);
    
    // 카드 생성
    memoryCards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
    
    // 타이머 시작
    memoryTimeLeft = 60;
    updateMemoryTimer();
    memoryTimer = setInterval(() => {
        memoryTimeLeft--;
        updateMemoryTimer();
        if (memoryTimeLeft <= 0) {
            endMemoryGame();
        }
    }, 1000);
    
    matchedPairs = 0;
    wrongAttempts = 0;
    gameScores.memory = 0;
    updateMemoryScore();
    updateMemoryWrongAttempts();
}

function flipCard(card) {
    if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }
    
    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        setTimeout(checkMatch, 500);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.symbol === card2.dataset.symbol) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        // 카드 쌍을 맞출 때마다 1개씩 증가
        matchedPairs++;
        updateMemoryScore();
        
        if (matchedPairs === memoryCards.length / 2) {
            endMemoryGame();
        }
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.textContent = '';
        card2.textContent = '';
        // 카드 쌍을 틀릴 때마다 1개씩 증가
        wrongAttempts++;
        updateMemoryWrongAttempts();
    }
    
    flippedCards = [];
}

function updateMemoryScore() {
    // 게임 중에는 점수를 표시하지 않고, 게임 종료 시에만 계산된 점수를 표시
    document.getElementById('memory-score').textContent = '계산 중...';
}

function updateMemoryTimer() {
    document.getElementById('memory-time').textContent = memoryTimeLeft;
}

function updateMemoryWrongAttempts() {
    const wrongAttemptsEl = document.getElementById('memory-wrong');
    if (wrongAttemptsEl) {
        wrongAttemptsEl.textContent = wrongAttempts;
    }
}

function endMemoryGame() {
    clearInterval(memoryTimer);
    
    // 새로운 점수 계산 방식
    if (matchedPairs >= 8) {
        // 첫번째 경우: 맞춘 횟수가 8회 이상일 때
        gameScores.memory = 200 - (wrongAttempts * 10);
    } else {
        // 두번째 경우: 맞춘 횟수가 8회 미만일 때
        gameScores.memory = (matchedPairs * 23) - (wrongAttempts * 10);
    }
    
    // 최소 점수는 0점
    gameScores.memory = Math.max(0, gameScores.memory);
    
    showResult('memory');
}

// 음악 따라 누르기 게임
let musicPattern = [];
let playerPattern = [];
let musicLevel = 1;
let isPlaying = false;

// 음악 소리 재생 함수
function playNote(index) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 도레미파솔라시도 주파수 (C4부터 시작)
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequencies[index], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function initMusicGame() {
    const patternContainer = document.getElementById('music-pattern');
    patternContainer.innerHTML = '';
    
    // 3x3 버튼 생성
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'pattern-btn';
        btn.textContent = i + 1;
        btn.dataset.index = i;
        btn.addEventListener('click', () => handleMusicClick(i));
        patternContainer.appendChild(btn);
    }
    
    musicLevel = 1;
    gameScores.music = 0;
    isPlaying = false;
    updateMusicScore();
    updateMusicLevel();
    
    // 시작 버튼 표시
    const startBtn = document.getElementById('music-start-btn');
    if (startBtn) {
        startBtn.style.display = 'block';
    }
}

function startMusicGame() {
    if (isPlaying) return;
    
    isPlaying = true;
    playerPattern = [];
    
    // 시작 버튼 숨기기
    const startBtn = document.getElementById('music-start-btn');
    if (startBtn) {
        startBtn.style.display = 'none';
    }
    
    generateMusicPattern();
    playMusicPattern();
}

function generateMusicPattern() {
    musicPattern = [];
    const length = selectedAge === 'child' ? 3 + musicLevel : 4 + musicLevel;
    
    for (let i = 0; i < length; i++) {
        musicPattern.push(Math.floor(Math.random() * 9));
    }
}

function playMusicPattern() {
    let i = 0;
    const interval = setInterval(() => {
        if (i >= musicPattern.length) {
            clearInterval(interval);
            isPlaying = false;
            return;
        }
        
        const btn = document.querySelector(`[data-index="${musicPattern[i]}"]`);
        if (btn) {
            console.log(`Highlighting button ${musicPattern[i]}`);
            
            // 기존 클래스 제거
            btn.classList.remove('active', 'highlight', 'pattern-highlight');
            
            // 강제로 스타일 적용
            btn.style.background = '#ff6b6b';
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.8)';
            btn.style.border = '3px solid #ff4757';
            btn.style.zIndex = '10';
            
            // 클래스 추가
            btn.classList.add('active', 'highlight', 'pattern-highlight');
            
            // 패턴 재생 시에도 소리 재생
            playNote(musicPattern[i]);
            
            setTimeout(() => {
                if (btn) {
                    btn.classList.remove('active', 'highlight', 'pattern-highlight');
                    // 인라인 스타일 제거
                    btn.style.background = '';
                    btn.style.transform = '';
                    btn.style.boxShadow = '';
                    btn.style.border = '';
                    btn.style.zIndex = '';
                }
            }, 800);
        } else {
            console.error(`Button with index ${musicPattern[i]} not found`);
        }
        
        i++;
    }, 1000);
}

function handleMusicClick(index) {
    if (isPlaying) return;
    
    const btn = document.querySelector(`[data-index="${index}"]`);
    if (btn) {
        // 클릭 시 강조 효과
        btn.style.background = '#28a745';
        btn.style.transform = 'scale(0.95)';
        btn.classList.add('active');
        
        // 음악 소리 재생
        playNote(index);
        
        setTimeout(() => {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.transform = '';
        }, 200);
    }
    
    playerPattern.push(index);
    
    // 패턴 확인
    if (playerPattern.length === musicPattern.length) {
        checkMusicPattern();
    }
}

function checkMusicPattern() {
    const isCorrect = playerPattern.every((value, index) => value === musicPattern[index]);
    
    if (isCorrect) {
        gameScores.music += musicLevel * 10;
        musicLevel++;
        updateMusicScore();
        updateMusicLevel();
        
        if (musicLevel > 5) {
            endMusicGame();
        } else {
            setTimeout(() => {
                startMusicGame();
            }, 1000);
        }
    } else {
        endMusicGame();
    }
}

function updateMusicScore() {
    document.getElementById('music-score').textContent = gameScores.music;
}

function updateMusicLevel() {
    document.getElementById('music-level').textContent = musicLevel;
}

function endMusicGame() {
    isPlaying = false;
    
    // 시작 버튼 다시 표시
    const startBtn = document.getElementById('music-start-btn');
    if (startBtn) {
        startBtn.style.display = 'block';
    }
    
    showResult('music');
}

// 시험 게임 (무작위 단어 쌍 + 꽃/만화 이름 기억)
let wordPairs = [];
let nameList = [];
let shownNames = [];
let currentQuestion = 0;
let quizAnswers = [];
let studyTimer = null;
let studyTimeLeft = 90; // 1분 30초
let quizPhase = 'word-pairs'; // 'word-pairs' 또는 'name-memory'

function initQuizGame() {
    // 무작위 단어 쌍 생성
    const nouns = ['사과', '책상', '컴퓨터', '자동차', '학교', '병원', '공원', '도서관', '식당', '은행', '우체국', '경찰서', '소방서', '버스', '지하철', '비행기', '배', '자전거', '오토바이', '택시'];
    const verbs = ['달리다', '읽다', '쓰다', '먹다', '마시다', '자다', '일어나다', '앉다', '서다', '걷다', '뛰다', '점프하다', '춤추다', '노래하다', '웃다', '울다', '생각하다', '기억하다', '잊다', '배우다'];
    
    // 무작위로 10쌍 선택
    const shuffledNouns = [...nouns].sort(() => Math.random() - 0.5);
    const shuffledVerbs = [...verbs].sort(() => Math.random() - 0.5);
    
    wordPairs = [];
    for (let i = 0; i < 10; i++) {
        wordPairs.push({
            noun: shuffledNouns[i],
            verb: shuffledVerbs[i]
        });
    }
    
    // 연령대별 이름 목록
    if (selectedAge === 'child') {
        // 유아용 만화 이름 목록
        nameList = [
            '뽀로로', '뚝딱이', '크롱', '루피', '에디', '포비', '해리', '로이', '페티', '스누피',
            '찰리브라운', '피카츄', '꼬부기', '이상해씨', '파이리', '야도란', '피죤', '꼬렛', '고라파덕', '잠만보',
            '도라에몽', '노진구', '신이슬', '퉁퉁이', '비실이', '왕코', '도라', '부츠', '디에고', '스와이퍼',
            '포켓몬', '디지몬', '유희왕', '원피스', '나루토', '드래곤볼', '블리치', '명탐정코난', '짱구', '맹구',
            '철수', '유리', '훈이', '영희', '수지', '민수', '영수', '미영', '지영', '수영',
            '태권V', '로보트태권V', '마징가Z', '그렌다이저', '겟타로보', '볼테스V', '다이모스', '코만도', '스페이스', '배틀',
            '아톰', '아스테로', '우라사', '지로', '토비오', '히카리', '미츠코', '오차노메', '시바', '타마',
            '포켓몬스터', '디지몬어드벤처', '유희왕듀얼몬스터즈', '원피스', '나루토', '드래곤볼', '블리치', '명탐정코난', '짱구는못말려', '맹구',
            '철수는못말려', '유리는못말려', '훈이는못말려', '영희는못말려', '수지는못말려', '민수는못말려', '영수는못말려', '미영은못말려', '지영은못말려', '수영은못말려'
        ];
    } else {
        // 노인용 꽃 이름 목록
        nameList = [
            '장미', '튤립', '해바라기', '백합', '카네이션', '국화', '수국', '진달래', '개나리', '벚꽃',
            '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃', '벚꽃', '산수유', '개나리', '진달래',
            '철쭉', '진달래', '개나리', '벚꽃', '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃',
            '장미', '튤립', '해바라기', '백합', '카네이션', '국화', '수국', '진달래', '개나리', '벚꽃',
            '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃', '벚꽃', '산수유', '개나리', '진달래',
            '철쭉', '진달래', '개나리', '벚꽃', '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃',
            '장미', '튤립', '해바라기', '백합', '카네이션', '국화', '수국', '진달래', '개나리', '벚꽃',
            '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃', '벚꽃', '산수유', '개나리', '진달래',
            '철쭉', '진달래', '개나리', '벚꽃', '매화', '복숭아꽃', '사과꽃', '배꽃', '살구꽃', '앵두꽃',
            '장미', '튤립', '해바라기', '백합', '카네이션', '국화', '수국', '진달래', '개나리', '벚꽃'
        ];
    }
    
    currentQuestion = 0;
    gameScores.quiz = 0;
    quizAnswers = [];
    quizPhase = 'word-pairs';
    showStudyScreen();
}

function showStudyScreen() {
    const content = document.getElementById('quiz-content');
    
    if (quizPhase === 'word-pairs') {
        // 단어 쌍 표 생성
        let tableHTML = '<div class="study-table">';
        wordPairs.forEach((pair, index) => {
            tableHTML += `
                <div class="word-pair">
                    <span class="noun">${pair.noun}</span>
                    <span class="arrow">→</span>
                    <span class="verb">${pair.verb}</span>
                </div>
            `;
        });
        tableHTML += '</div>';
        
        content.innerHTML = `
            <div class="study-instruction">아래 단어 쌍을 1분 30초 동안 외워주세요!</div>
            ${tableHTML}
            <div class="study-timer">남은 시간: <span id="study-time">90</span>초</div>
            <button class="next-btn" onclick="startQuiz()">다음으로</button>
        `;
    } else {
        // 이름 목록 표시
        const shuffledNames = [...nameList].sort(() => Math.random() - 0.5);
        shownNames = shuffledNames.slice(0, 20); // 20개만 표시
        
        let namesHTML = '<div class="name-list">';
        shownNames.forEach((name, index) => {
            namesHTML += `<div class="name-item">${index + 1}. ${name}</div>`;
        });
        namesHTML += '</div>';
        
        const categoryName = selectedAge === 'child' ? '만화 이름' : '꽃 이름';
        
        content.innerHTML = `
            <div class="study-instruction">아래 ${categoryName} 20개를 1분 30초 동안 외워주세요!</div>
            ${namesHTML}
            <div class="study-timer">남은 시간: <span id="study-time">90</span>초</div>
            <button class="next-btn" onclick="startNameQuiz()">다음으로</button>
        `;
    }
    
    // 타이머 시작
    studyTimeLeft = 90;
    updateStudyTimer();
    studyTimer = setInterval(() => {
        studyTimeLeft--;
        updateStudyTimer();
        if (studyTimeLeft <= 0) {
            if (quizPhase === 'word-pairs') {
                startQuiz();
            } else {
                startNameQuiz();
            }
        }
    }, 1000);
}

function updateStudyTimer() {
    const timerElement = document.getElementById('study-time');
    if (timerElement) {
        timerElement.textContent = studyTimeLeft;
    }
}

function startQuiz() {
    clearInterval(studyTimer);
    showQuizQuestion();
}

function showQuizQuestion() {
    const question = wordPairs[currentQuestion];
    const content = document.getElementById('quiz-content');
    
    // 랜덤하게 명사 또는 동사를 빈칸으로 만들기
    const isNounBlank = Math.random() < 0.5;
    const blankWord = isNounBlank ? question.noun : question.verb;
    const shownWord = isNounBlank ? question.verb : question.noun;
    
    content.innerHTML = `
        <div class="quiz-question">
            ${isNounBlank ? '명사' : '동사'}를 입력해주세요:
        </div>
        <div class="quiz-pair">
            ${isNounBlank ? 
                `<span class="blank">_____</span> → <span class="shown">${shownWord}</span>` :
                `<span class="shown">${shownWord}</span> → <span class="blank">_____</span>`
            }
        </div>
        <div class="quiz-input">
            <input type="text" id="answer-input" placeholder="정답을 입력하세요" onkeypress="handleAnswerKey(event)">
            <button onclick="submitAnswer()">확인</button>
        </div>
    `;
    
    document.getElementById('quiz-current').textContent = currentQuestion + 1;
    document.getElementById('quiz-total').textContent = wordPairs.length;
    updateQuizScore();
    
    // 입력 필드에 포커스
    setTimeout(() => {
        document.getElementById('answer-input').focus();
    }, 100);
}

function handleAnswerKey(event) {
    if (event.key === 'Enter') {
        if (quizPhase === 'word-pairs') {
            submitAnswer();
        } else {
            submitNameAnswer();
        }
    }
}

function submitAnswer() {
    const input = document.getElementById('answer-input');
    const userAnswer = input.value.trim();
    const question = wordPairs[currentQuestion];
    
    // 정답 확인 (명사 또는 동사 중 하나가 맞으면 정답)
    const isCorrect = userAnswer === question.noun || userAnswer === question.verb;
    
    quizAnswers[currentQuestion] = {
        answer: userAnswer,
        correct: isCorrect,
        expected: question
    };
    
    if (isCorrect) {
        gameScores.quiz += 10;
    }
    
    // 결과 표시
    const content = document.getElementById('quiz-content');
    content.innerHTML = `
        <div class="quiz-result ${isCorrect ? 'correct' : 'wrong'}">
            ${isCorrect ? '정답입니다!' : '틀렸습니다.'}
        </div>
        <div class="correct-answer">
            정답: ${question.noun} → ${question.verb}
        </div>
        <div class="your-answer">
            입력한 답: ${userAnswer}
        </div>
    `;
    
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < wordPairs.length) {
            showQuizQuestion();
        } else {
            // 단어 쌍 퀴즈 완료 후 이름 기억 퀴즈로 이동
            quizPhase = 'name-memory';
            currentQuestion = 0;
            showStudyScreen();
        }
    }, 2000);
}

function startNameQuiz() {
    clearInterval(studyTimer);
    showNameQuiz();
}

function showNameQuiz() {
    const content = document.getElementById('quiz-content');
    const categoryName = selectedAge === 'child' ? '만화 이름' : '꽃 이름';
    
    // 40개의 체크리스트 생성 (shownNames + 20개의 다른 이름들)
    const allNames = [...nameList].sort(() => Math.random() - 0.5);
    const quizNames = [...shownNames, ...allNames.filter(name => !shownNames.includes(name)).slice(0, 20)];
    
    let checklistHTML = '<div class="name-checklist">';
    quizNames.forEach((name, index) => {
        const wasShown = shownNames.includes(name);
        checklistHTML += `
            <div class="checklist-item">
                <input type="checkbox" id="name-${index}" data-name="${name}" data-shown="${wasShown}">
                <label for="name-${index}">${name}</label>
            </div>
        `;
    });
    checklistHTML += '</div>';
    
    content.innerHTML = `
        <div class="quiz-question">아까 나온 ${categoryName}들을 체크해주세요!</div>
        ${checklistHTML}
        <button class="submit-checklist-btn" onclick="submitNameChecklist()">확인</button>
    `;
    
    document.getElementById('quiz-current').textContent = '이름 기억';
    document.getElementById('quiz-total').textContent = '체크리스트';
    updateQuizScore();
}

function submitNameChecklist() {
    const checkboxes = document.querySelectorAll('.name-checklist input[type="checkbox"]');
    let correctChecks = 0;
    let totalChecks = 0;
    
    checkboxes.forEach(checkbox => {
        const name = checkbox.dataset.name;
        const wasShown = checkbox.dataset.shown === 'true';
        const isChecked = checkbox.checked;
        
        if (wasShown && isChecked) {
            correctChecks++;
        } else if (!wasShown && !isChecked) {
            correctChecks++;
        }
        totalChecks++;
    });
    
    const accuracy = (correctChecks / totalChecks) * 100;
    gameScores.quiz += Math.round(accuracy / 10); // 정확도에 따라 점수 추가
    
    // 결과 표시
    const content = document.getElementById('quiz-content');
    content.innerHTML = `
        <div class="quiz-result correct">
            이름 기억 테스트 완료!
        </div>
        <div class="correct-answer">
            정확도: ${accuracy.toFixed(1)}% (${correctChecks}/${totalChecks})
        </div>
        <div class="your-answer">
            추가 점수: +${Math.round(accuracy / 10)}점
        </div>
    `;
    
    setTimeout(() => {
        endQuizGame();
    }, 3000);
}

function updateQuizScore() {
    document.getElementById('quiz-score').textContent = gameScores.quiz;
}

function endQuizGame() {
    showResult('quiz');
}

// 결과 화면
function showResult(gameType) {
    const resultContent = document.getElementById('result-content');
    const score = gameScores[gameType];
    let maxScore, percentage, message, correctCount, wrongCount, accuracy;
    
    if (gameType === 'memory') {
        maxScore = 200; // 개선된 점수 시스템으로 최대 점수 증가
        percentage = Math.round((score / maxScore) * 100);
        correctCount = matchedPairs;
        wrongCount = wrongAttempts;
        accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 100) || 0;
        message = `맞춘 쌍: ${correctCount}개, 틀린 횟수: ${wrongCount}회`;
    } else if (gameType === 'music') {
        maxScore = 150;
        percentage = Math.round((score / maxScore) * 100);
        correctCount = musicLevel - 1;
        wrongCount = 0;
        accuracy = percentage;
    } else {
        maxScore = 200; // 단어 쌍 + 이름 기억 테스트
        percentage = Math.round((score / maxScore) * 100);
        const categoryName = selectedAge === 'child' ? '만화 이름' : '꽃 이름';
        message = `단어 쌍: ${Math.min(gameScores.quiz, 100)}점, ${categoryName} 기억: ${Math.max(0, gameScores.quiz - 100)}점`;
        correctCount = Math.round(score / 10);
        wrongCount = 20 - correctCount;
        accuracy = percentage;
    }
    
    let gradeMessage = '';
    if (percentage >= 80) {
        gradeMessage = '훌륭합니다! 기억력이 매우 좋습니다.';
    } else if (percentage >= 60) {
        gradeMessage = '좋습니다! 기억력이 양호합니다.';
    } else if (percentage >= 40) {
        gradeMessage = '보통입니다. 조금 더 연습해보세요.';
    } else {
        gradeMessage = '기억력을 더 키워오세요!';
    }
    
    resultContent.innerHTML = `
        <div class="result-main">
            <div class="result-grade">${gradeMessage}</div>
            <div class="result-score">점수: ${score}점 (${percentage}%)</div>
            ${message ? `<div class="result-details">${message}</div>` : ''}
        </div>
        <div class="result-stats">
            <div class="stat-item">
                <div class="stat-label">맞힌 개수</div>
                <div class="stat-value correct">${correctCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">틀린 개수</div>
                <div class="stat-value wrong">${wrongCount}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">정답률</div>
                <div class="stat-value accuracy">${accuracy}%</div>
            </div>
        </div>
    `;
    
    showScreen('result-screen');
}

function restartGame() {
    showScreen('start-screen');
    selectedAge = '';
    currentGame = '';
    gameScores = { memory: 0, music: 0, quiz: 0 };
} 
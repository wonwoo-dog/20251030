// 全域變數
let quizTable;         // 儲存 loadTable() 讀取的 CSV 資料
let questions = [];    // 儲存整理後的題庫陣列
let currentQuestionIndex = 0; // 當前問題的索引
let score = 0;         // 分數
let quizState = 'quiz'; // 測驗狀態: 'quiz' (測驗中), 'result' (顯示結果)
let selectedOption = null; // 學生選擇的選項
let answerChecked = false; // 是否已檢查答案

// 游標特效相關
let cursorTrail = []; // 游標軌跡點
const TRAIL_LENGTH = 15; // 軌跡長度

// 動態特效相關
let particleSystem; // 粒子系統

// 在 setup() 之前載入資料，確保資料準備好
function preload() {
    // 載入 quiz.csv 檔案。'csv' 格式, 包含 'header' 標頭列。
    // 請確認 quiz.csv 檔案放在專案資料夾中，或者 data/ 子資料夾中
    quizTable = loadTable('quiz.csv', 'csv', 'header');
}

function setup() {
    createCanvas(800, 600);
    textAlign(LEFT, CENTER);
    textSize(18);
    noStroke();

    // 解析 CSV 資料為更易於操作的陣列
    parseQuizData(quizTable);

    // 初始化粒子系統
    particleSystem = new ParticleSystem();
    
    // 隱藏預設的滑鼠游標
    noCursor(); 
}

function draw() {
    background(240);
    
    // 繪製自定義游標特效 (星星/光點)
    drawCursorTrail();

    if (quizState === 'quiz') {
        drawQuiz();
    } else if (quizState === 'result') {
        drawResultAnimation();
    }
}

// === 狀態處理函式 ===

// 將 p5.Table 物件轉換為方便的 JavaScript 陣列
function parseQuizData(table) {
    let rows = table.getRows();
    for (let row of rows) {
        questions.push({
            question: row.getString('question'),
            options: {
                A: row.getString('optionA'),
                B: row.getString('optionB'),
                C: row.getString('optionC')
            },
            correct: row.getString('correct') // 'optionA', 'optionB', 'optionC'
        });
    }
}

// 處理滑鼠點擊事件
function mousePressed() {
    if (quizState === 'quiz' && !answerChecked) {
        // 檢查點擊了哪個選項
        let q = questions[currentQuestionIndex];
        let options = ['A', 'B', 'C'];
        
        for (let i = 0; i < options.length; i++) {
            let optionKey = 'option' + options[i];
            // 每個選項按鈕的 y 座標 (根據 drawQuiz 中的設定)
            let optionY = 200 + i * 80; 

            // 檢查滑鼠是否在選項矩形內
            if (mouseX > 100 && mouseX < width - 100 && 
                mouseY > optionY - 25 && mouseY < optionY + 25) {
                
                selectedOption = optionKey;
                checkAnswer(q, selectedOption);
                break;
            }
        }
    } else if (quizState === 'quiz' && answerChecked) {
        // 檢查完畢後，點擊跳到下一題
        goToNextQuestion();
    } else if (quizState === 'result') {
        // 在結果畫面點擊，可以重設測驗 (可選)
        // resetQuiz(); 
    }
}

// 檢查答案並更新狀態
function checkAnswer(question, chosenOption) {
    answerChecked = true;
    
    if (question.correct === chosenOption) {
        score++;
        // 正確：產生稱讚粒子
        particleSystem.createParticles('praise', mouseX, mouseY);
    } else {
        // 錯誤：產生鼓勵粒子
        particleSystem.createParticles('encourage', mouseX, mouseY);
    }
}

// 跳到下一題或結束測驗
function goToNextQuestion() {
    currentQuestionIndex++;
    selectedOption = null;
    answerChecked = false;

    if (currentQuestionIndex >= questions.length) {
        quizState = 'result'; // 結束測驗，進入結果畫面
        // 根據分數決定結果畫面的粒子效果
        let finalScoreRatio = score / questions.length;
        if (finalScoreRatio >= 0.8) {
             particleSystem.createParticles('success', width / 2, height / 2, 100);
        } else if (finalScoreRatio >= 0.5) {
             particleSystem.createParticles('good', width / 2, height / 2, 50);
        } else {
             particleSystem.createParticles('tryAgain', width / 2, height / 2, 30);
        }
    }
}

// === 繪圖函式 ===

// 繪製測驗介面
function drawQuiz() {
    let q = questions[currentQuestionIndex];

    // 繪製進度/分數
    fill(50);
    textSize(18);
    text(`分數: ${score} / ${currentQuestionIndex}`, 600, 50);
    text(`問題 ${currentQuestionIndex + 1} / ${questions.length}`, 100, 50);

    // 繪製問題
    textSize(24);
    fill(30);
    text(q.question, 100, 120, width - 200);

    // 繪製選項
    let options = ['A', 'B', 'C'];
    for (let i = 0; i < options.length; i++) {
        let optionKey = 'option' + options[i];
        let optionText = q.options[options[i]];
        let optionY = 200 + i * 80;

        let isHover = mouseX > 100 && mouseX < width - 100 && 
                      mouseY > optionY - 25 && mouseY < optionY + 25;
        
        // 選項顏色和特效
        let buttonColor = color(200); // 預設顏色
        let textColor = color(30);
        let selectionEffect = 0; // 選取特效的震盪量

        if (!answerChecked) {
            // 未檢查答案時：滑鼠懸停特效
            if (isHover) {
                buttonColor = color(180, 200, 255); // 淺藍色
                selectionEffect = sin(frameCount * 0.1) * 3; // 輕微震盪
            }
        } else {
            // 已檢查答案時：顯示正確/錯誤顏色
            if (optionKey === q.correct) {
                buttonColor = color(100, 255, 100); // 正確: 綠色
                selectionEffect = sin(frameCount * 0.2) * 5; // 勝利震盪
            } else if (optionKey === selectedOption) {
                buttonColor = color(255, 100, 100); // 錯誤: 紅色
            }
        }
        
        // 選項矩形 (含選取特效)
        fill(buttonColor);
        rect(100 + selectionEffect, optionY - 25 + selectionEffect, width - 200, 50, 10);
        
        // 選項文字
        fill(textColor);
        textSize(18);
        text(`${options[i]}. ${optionText}`, 120 + selectionEffect, optionY + selectionEffect);
    }
    
    // 繪製提示訊息
    if (answerChecked) {
        fill(50, 150, 255);
        textSize(24);
        text('點擊任意處繼續...', width / 2 - 100, height - 50);
    }

    // 運行粒子系統
    particleSystem.run();
}

// 繪製結果畫面和動畫
function drawResultAnimation() {
    let finalScoreRatio = score / questions.length;
    let message = "";
    let messageColor;

    // 根據分數比例顯示不同訊息
    if (finalScoreRatio >= 0.8) {
        message = "🎉 太棒了! 優秀的成績! 🎉";
        messageColor = color(255, 200, 0); // 金色
    } else if (finalScoreRatio >= 0.5) {
        message = "👍 幹得好! 再接再厲! 👍";
        messageColor = color(0, 200, 255); // 藍色
    } else {
        message = "💪 繼續努力! 你一定會進步! 💪";
        messageColor = color(255, 100, 100); // 紅色
    }

    // 繪製背景 (可加入動態背景)
    fill(20, 20, 50, 5); // 輕微的深色拖影效果
    rect(0, 0, width, height);

    // 繪製最終分數
    fill(messageColor);
    textSize(40);
    textAlign(CENTER, CENTER);
    text(message, width / 2, height / 2 - 50);
    
    textSize(50);
    text(`最終分數: ${score} / ${questions.length}`, width / 2, height / 2 + 30);
    
    // 運行結果粒子動畫
    particleSystem.run();
}

// === 特效函式 (游標軌跡) ===

function drawCursorTrail() {
    // 儲存當前滑鼠位置
    cursorTrail.push({ x: mouseX, y: mouseY, life: 255 });

    // 限制軌跡長度
    if (cursorTrail.length > TRAIL_LENGTH) {
        cursorTrail.shift();
    }

    // 繪製軌跡點 (使用星星/光點效果)
    for (let i = 0; i < cursorTrail.length; i++) {
        let p = cursorTrail[i];
        let alpha = map(i, 0, cursorTrail.length, 0, 200); // 越舊越透明
        let size = map(i, 0, cursorTrail.length, 5, 15); // 越舊越小

        fill(255, 255, 0, alpha); // 黃色光點
        
        // 繪製一個小星星 (四個角)
        push();
        translate(p.x, p.y);
        rotate(frameCount * 0.05); // 讓星星旋轉
        
        // 簡單的十字星形狀
        rect(0, -size/2, 1, size);
        rect(-size/2, 0, size, 1);
        
        pop();
    }
}


// === 粒子系統類別 (Particle System Class) ===

class Particle {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(2, 5));
        this.acc = createVector(0, 0);
        this.life = 255;
        this.type = type;
        this.size = random(5, 15);

        // 根據類型設定顏色和行為
        switch (this.type) {
            case 'praise': // 稱讚: 綠色/黃色上升
                this.color = color(random(100, 200), 255, random(100, 200), this.life);
                this.vel.y = random(-5, -1); // 向上
                this.acc = createVector(0, -0.05); // 輕微向上浮力
                break;
            case 'encourage': // 鼓勵: 藍色/紫色擴散
                this.color = color(random(100, 200), random(100, 200), 255, this.life);
                this.acc = createVector(0, 0.1); // 輕微重力
                break;
            case 'success': // 最終勝利: 爆炸式金色
            case 'good': // 良好表現: 擴散式
            case 'tryAgain': // 再努力: 閃爍式
                this.color = color(random(200, 255), random(150, 255), random(0, 50), this.life); // 黃-紅
                this.size = random(10, 30);
                this.vel = p5.Vector.random2D().mult(random(3, 8));
                this.acc = createVector(0, 0.2); // 重力
                break;
        }
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.life -= 4; // 逐漸消失
        this.size *= 0.98;
    }

    display() {
        if (this.life > 0) {
            this.color.setAlpha(this.life);
            fill(this.color);
            ellipse(this.pos.x, this.pos.y, this.size);
        }
    }

    isFinished() {
        return this.life < 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createParticles(type, x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, type));
        }
    }

    run() {
        // 更新並顯示所有粒子，移除已消失的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.update();
            p.display();
            if (p.isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }
}
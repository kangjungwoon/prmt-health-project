/* --- 
    v10 Pro Health Coach (script.js)
    '뇌(로직)' 파일
--- */

// --- 1. '데이터베이스' (스마트 냉장고, 메뉴판, 안내문구) ---

// (v9 '스마트 냉장고')
const foodDatabase = {
    'toast': { kcal: 180, tags: ['high_carb', 'processed'] }, 'egg_fry': { kcal: 120, tags: ['high_protein', 'high_fat'] }, 'cereal': { kcal: 150, tags: ['high_carb', 'high_sugar', 'processed'] }, 'milk': { kcal: 125, tags: ['high_protein', 'high_fat'] }, 'apple': { kcal: 95, tags: ['fruit', 'high_sugar', 'fiber'] }, 'americano': { kcal: 10, tags: ['beverage'] }, 'latte': { kcal: 180, tags: ['beverage', 'high_sugar', 'high_fat'] }, 'banana': { kcal: 105, tags: ['fruit', 'high_sugar', 'high_carb'] }, 'nuts': { kcal: 160, tags: ['snack', 'high_fat'] }, 'rice': { kcal: 300, tags: ['high_carb'] }, 'kimchi_jjigae': { kcal: 450, tags: ['high_sodium', 'high_fat', 'spicy'] }, 'jeyuk_bokkeum': { kcal: 550, tags: ['high_protein', 'high_fat', 'high_sodium', 'spicy'] }, 'salad': { kcal: 150, tags: ['fiber', 'low_kcal'] }, 'chicken_breast': { kcal: 165, tags: ['high_protein', 'low_fat', 'low_kcal'] }, 'ramen': { kcal: 550, tags: ['high_carb', 'high_fat', 'high_sodium', 'processed'] }
};

// (v9 '끼니별 메뉴판')
const foodMenus = {
    'breakfast': ['toast', 'egg_fry', 'cereal', 'milk', 'apple'],
    'morningsnack': ['americano', 'latte', 'banana', 'nuts'],
    'lunch': ['rice', 'kimchi_jjigae', 'jeyuk_bokkeum', 'salad'],
    'afternoonsnack': ['americano', 'latte', 'banana', 'nuts'],
    'dinner': ['rice', 'chicken_breast', 'salad', 'jeyuk_bokkeum'],
    'nightsnack': ['ramen', 'milk', 'nuts']
};

// (v10 '안내 문구')
const guidanceMessages = {
    'page-bmi': "기본 신체 상태(BMI)를 확인합니다.",
    'page-sugar': "혈당은 식단 조언에 중요한 기준이 됩니다.",
    'page-activity': "활동량을 선택해주세요.",
    'page-sleep': "수면 시간을 입력해주세요.",
    'page-breakfast': "아침 식사를 기록해 주세요.",
    'page-morningsnack': "오전 간식을 기록해주세요.",
    'page-lunch': "점심 식사를 기록해 주세요.",
    'page-afternoonsnack': "오후 간식을 기록해주세요.",
    'page-dinner': "저녁 식사를 기록해 주세요.",
    'page-nightsnack': "야간 섭취를 기록해주세요.",
    'page-results': "종합 분석 결과입니다."
};

// --- 2. '앱 상태' 변수 (현재 페이지, 차트 객체) ---
let currentPageId = 'page-bmi'; // 현재 보고 있는 페이지 ID
const totalPages = 11; // v10은 총 11단계
let currentPageIndex = 1; // 현재 페이지 번호 (1/11)

// v10 '차트' 객체를 저장할 변수 (나중에 '처음으로' 시 파괴하기 위함)
let calorieDonutChart = null;
let mealBarChart = null;

// v8 '타이핑' 타이머 저장 변수
let currentTypingTimer;


// --- 3. '헬퍼' 함수 (카운터, 입력감시, 타이핑) ---

// (v9 재사용: 카운터 함수)
function increaseCount(mealTime, foodId) {
    const el = document.getElementById(`count-${mealTime}-${foodId}`);
    let count = parseInt(el.innerText);
    el.innerText = ++count;
}
function decreaseCount(mealTime, foodId) {
    const el = document.getElementById(`count-${mealTime}-${foodId}`);
    let count = parseInt(el.innerText);
    if (count > 0) el.innerText = --count;
}

// (v8 재사용: 입력 감시관)
function validateInput(element) {
    // 숫자가 아닌 것(소수점 . 포함)을 모두 제거
    element.value = element.value.replace(/[^0-9]/g, '');
}

// (v9 재사용: 타이핑 효과)
function typeEffect(elementId, text, speed = 70, isPlaceholder = false, callback = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    let i = 0;
    if (isPlaceholder) element.placeholder = ''; else element.innerHTML = '';
    function type() {
        if (i < text.length) {
            let char = text.charAt(i);
            if (isPlaceholder) element.placeholder += char; else element.innerHTML += char;
            i++;
            currentTypingTimer = setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}


// --- 4. 'v10 핵심 로직' (페이지 전환, 진행 막대) ---

// 페이지 전환 로직 수정
function showPage(pageId, direction = 'forward') {
    const currentPage = document.querySelector('.page-section.active');
    const nextPage = document.getElementById(pageId);
    
    if (!nextPage) return;

    if (currentPage) {
        currentPage.classList.remove('active');
    }

    nextPage.classList.add('active');
    currentPageId = pageId;
    localStorage.setItem('currentPage', pageId);
    updateProgressBar();
}

// 현재 페이지 저장
function saveCurrentPage(pageId) {
    localStorage.setItem('currentPage', pageId);
}

// v10 '프로그레스 바' 업데이트 함수
function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = (currentPageIndex / totalPages) * 100;
    progressBar.style.width = progressPercent + '%';
}

// v10 '활동량' 버튼 선택 함수
function selectActivity(level) {
    // 1. 모든 버튼의 'selected' 스타일 제거
    document.getElementById('activity-low').classList.remove('selected');
    document.getElementById('activity-mid').classList.remove('selected');
    document.getElementById('activity-high').classList.remove('selected');
    
    // 2. 클릭한 버튼에만 'selected' 스타일 추가
    document.getElementById(`activity-${level}`).classList.add('selected');
    
    // 3. 숨겨진 input에 값 저장 (나중에 계산할 때 쓰려고)
    document.getElementById('activity-level').value = level;
}

let selectedActivities = new Set();

function toggleActivity(activity) {
    const button = document.getElementById(`activity-${activity}`);
    if (selectedActivities.has(activity)) {
        selectedActivities.delete(activity);
        button.classList.remove('selected');
    } else {
        selectedActivities.add(activity);
        button.classList.add('selected');
    }
    
    // 활동량 점수 계산 (예시)
    let activityScore = 0;
    selectedActivities.forEach(act => {
        switch(act) {
            case 'work': activityScore += 2; break;
            case 'walk': activityScore += 3; break;
            case 'exercise': activityScore += 5; break;
            case 'housework': activityScore += 3; break;
            case 'rest': activityScore += 1; break;
            case 'commute': activityScore += 2; break;
        }
    });
    
    // 결과 저장
    sessionStorage.setItem('activityScore', activityScore);
}


// --- 5. 'v10 메인 분석 엔진' (결과 확인) ---

// 결과 표시 로직 수정
function showFinalResults() {
    // 데이터 계산 및 차트 생성
    displayResults();
    
    // 결과 페이지로 전환
    showPage('page-results');
}

function displayResults() {
    // 1. 모든 값 가져오기
    let heightCm = parseFloat(document.getElementById('height').value) || 0;
    let weightKg = parseFloat(document.getElementById('weight').value) || 0;
    let bloodSugar = parseFloat(document.getElementById('blood-sugar').value) || 0;
    let activityLevel = document.getElementById('activity-level').value; // v10
    let sleepHours = parseFloat(document.getElementById('sleep-hours').value) || 0; // v10

    // 2. 결과 박스 DOM
    let bmiDiv = document.getElementById('bmi-result-area');
    let sugarDiv = document.getElementById('sugar-result-area');
    let calorieDiv = document.getElementById('calorie-result-area');
    let analysisDiv = document.getElementById('analysis-result-area');
    
    // 3. BMI 계산
    let bmi = 0;
    if (heightCm > 0 && weightKg > 0) {
        let heightM = heightCm / 100;
        bmi = (weightKg / (heightM * heightM));
        let statusMessage = "", statusClass = "";
        if (bmi < 18.5) { statusMessage = "저체중 😢"; statusClass = "status-underweight"; }
        else if (bmi >= 18.5 && bmi <= 22.9) { statusMessage = "정상 👍"; statusClass = "status-normal"; }
        else if (bmi >= 23 && bmi <= 24.9) { statusMessage = "과체중 😟"; statusClass = "status-overweight"; }
        else { statusMessage = "비만 🚨"; statusClass = "status-obese"; }
        bmiDiv.innerHTML = `<span class='bmi-value'>BMI: <strong>${bmi.toFixed(2)}</strong></span><span class='bmi-status ${statusClass}'>${statusMessage}</span>`;
        bmiDiv.style.display = "block";
    } else { bmiDiv.style.display = "none"; }

    // 4. 혈당 계산
    if (bloodSugar > 0) {
        let sugarMessage = "", sugarClass = "";
        if (bloodSugar < 100) { sugarMessage = "혈당 정상 👍"; sugarClass = "status-good"; }
        else if (bloodSugar >= 100 && bloodSugar <= 119) { sugarMessage = "혈당 경계 ⚠️"; sugarClass = "status-warning"; }
        else { sugarMessage = "혈당 위험 🚨"; sugarClass = "status-danger"; }
        sugarDiv.innerHTML = `<span class='sugar-value'>공복 혈당: <strong>${bloodSugar}</strong></span><span class='sugar-status ${sugarClass}'>${sugarMessage}</span>`;
        sugarDiv.style.display = "block";
    } else { sugarDiv.style.display = "none"; }
    
    // 5. 칼로리 & 태그 수집
    let totalCalories = 0;
    let allTags = [];
    let mealTotals = {}; // v10 차트용 끼니별 합계
    
    for (const meal in foodMenus) {
        mealTotals[meal] = 0; // 끼니별 0으로 초기화
        for (const food of foodMenus[meal]) {
            const count = parseInt(document.getElementById(`count-${meal}-${food}`).innerText);
            if (count > 0) {
                let kcal = foodDatabase[food].kcal * count;
                totalCalories += kcal;
                mealTotals[meal] += kcal; // v10 차트용
                allTags.push(...foodDatabase[food].tags);
            }
        }
    }
    
    // 6. 칼로리 결과 표시
    if (totalCalories > 0) {
        calorieDiv.innerHTML = `<span class='calorie-value'>총 섭취: <strong>${totalCalories}</strong> kcal</span><span class='calorie-status status-normal'></span>`;
        calorieDiv.style.display = "block";
    } else { calorieDiv.style.display = "none"; }

    // 7. --- 🚀 v10 분석 엔진 ---
    let adviceMessages = [];
    const uniqueTags = [...new Set(allTags)]; // 중복 태그 제거

    // [v10 조언 1: 칼로리 + 활동량]
    if (totalCalories > 2000 && activityLevel === 'low') {
        adviceMessages.push("🚨 **활동 부족:** 섭취한 칼로리에 비해 활동량이 너무 적습니다. 체중 증가의 원인이 될 수 있습니다.");
    } else if (totalCalories > 2500 && (activityLevel === 'mid' || activityLevel === 'high')) {
        adviceMessages.push("👍 **좋은 균형:** 섭취량이 많았지만, 그만큼 활발히 움직이셨네요! 건강한 신호입니다.");
    } else if (totalCalories < 1500 && activityLevel === 'high') {
         adviceMessages.push("⚠️ **에너지 부족:** 격렬한 운동에 비해 섭취 칼로리가 부족할 수 있습니다. 충분한 영양을 섭취하세요.");
    }

    // [v10 조언 2: 수면 + 혈당/식욕]
    if (sleepHours > 0 && sleepHours < 6) {
        if (bloodSugar >= 100) {
            adviceMessages.push("😴 **수면-혈당:** 6시간 미만의 수면은 공복 혈당을 높이는 주범 중 하나입니다. 오늘 밤은 푹 주무셔 보세요.");
        }
        if (uniqueTags.includes('high_sugar') || uniqueTags.includes('high_fat')) {
            adviceMessages.push("😴 **수면-식욕:** 혹시 오늘따라 식욕 조절이 힘들지 않으셨나요? 잠이 부족하면 '가짜 배고픔'이 생겨 고칼로리 음식을 찾게 될 수 있습니다.");
        }
    }

    // [v9 조언 3: BMI + 음식]
    if (bmi >= 23) {
        if (uniqueTags.includes('high_fat') || uniqueTags.includes('processed')) {
            adviceMessages.push("😟 **체중 관리:** 체중이 '과체중' 이상인데, 오늘 '고지방' 또는 '가공식품'(라면, 제육볶음 등)을 드셨네요. 체중 관리에 유의하세요.");
        }
    }
    
    // [v9 조언 4: 혈당 + 음식]
    if (bloodSugar >= 100) {
        if (uniqueTags.includes('high_carb') || uniqueTags.includes('high_sugar')) {
            adviceMessages.push("⚠️ **혈당 관리:** 혈당이 '경계' 이상인데, '고탄수화물'(밥, 면)이나 '당류'(과일, 라떼)를 섭취하셨네요. 혈당에 영향을 줄 수 있습니다.");
        }
    }

    // [v9 조언 5: 좋은 습관]
    if (uniqueTags.includes('high_protein') && uniqueTags.includes('low_fat')) {
        adviceMessages.push("👍 **좋은 선택:** '닭가슴살'처럼 '고단백/저지방' 식품을 챙겨 드셨군요. 훌륭합니다!");
    }
    if (uniqueTags.includes('fiber')) {
        adviceMessages.push("👍 **좋은 선택:** '샐러드'나 '사과'처럼 '섬유질'이 풍부한 음식을 드셨네요.");
    }
    
    // [v9 조언 6: 나쁜 습관]
    if (uniqueTags.includes('high_sodium')) {
        adviceMessages.push("🧂 **나트륨 주의:** '찌개'나 '라면' 등 '고나트륨' 식품을 드셨습니다. 섭취를 줄이는 것이 좋습니다.");
    }
    
    // 최종 조언 종합
    if (adviceMessages.length > 0) {
        analysisDiv.innerHTML = "<h3>👩‍⚕️ v10 종합 분석</h3>" + adviceMessages.map(msg => `<p>${msg}</p>`).join('');
    } else if (totalCalories == 0 && bmi == 0 && bloodSugar == 0) {
         analysisDiv.innerHTML = "<h3>👩‍⚕️ v10 종합 분석</h3><p>아직 입력된 정보가 없습니다. 1단계부터 입력해 주세요!</p>";
    } else {
        analysisDiv.innerHTML = "<h3>👩‍⚕️ v10 종합 분석</h3><p>🎉 특별한 위험 신호 없이 균형 잡힌 하루입니다! 멋져요!</p>";
    }
    analysisDiv.style.display = "block";
    
    // 8. --- 🚀 v10 차트 그리기 ---
    // (기존 차트가 있으면 파괴하고 새로 그림)
    if (calorieDonutChart) calorieDonutChart.destroy();
    if (mealBarChart) mealBarChart.destroy();
    
    // (도넛 차트: 총 섭취량. 목표는 2000kcal로 임시 설정)
    renderCalorieChart(totalCalories, 2000); 
    // (막대 차트: 끼니별 섭취량)
    renderMealChart(mealTotals);
    
    // 9. 마지막: 11단계 '결과 페이지' 보여주기
    showPage('page-results', 'forward');
}


// --- 6. 'v10 차트 그리기' 함수 (Chart.js) ---

// v10 '도넛 차트 중앙 텍스트' 플러그인
const doughnutTextPlugin = {
    id: 'doughnutText',
    afterDraw(chart, args, options) {
        const { ctx, data } = chart;
        const { top, bottom, left, right, width, height } = chart.chartArea;
        
        if (data.datasets[0].data.length === 0) return;

        ctx.save();
        const eatenKcal = data.datasets[0].data[0];
        const goalKcal = eatenKcal + data.datasets[0].data[1];
        const percentage = goalKcal > 0 ? Math.round((eatenKcal / goalKcal) * 100) : 0;

        // 1. 퍼센트 텍스트
        ctx.font = 'bold 2rem Noto Sans KR';
        ctx.fillStyle = 'var(--text-dark)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, width / 2 + left, height / 2 + top - 10);

        // 2. '섭취' 텍스트
        ctx.font = '0.9rem Noto Sans KR';
        ctx.fillStyle = 'var(--text-light)';
        ctx.fillText('섭취', width / 2 + left, height / 2 + top + 20);

        ctx.restore();
    }
};

// v10 '도넛 차트'
function renderCalorieChart(eatenKcal, goalKcal) {
    const ctx = document.getElementById('calorieDonutChart').getContext('2d');
    const remainingKcal = Math.max(0, goalKcal - eatenKcal); // 남은 칼로리 (0 이하면 0)
    
    calorieDonutChart = new Chart(ctx, {
        type: 'doughnut',
        plugins: [doughnutTextPlugin], // 중앙 텍스트 플러그인 적용
        data: {
            labels: ['섭취 칼로리', '남은 칼로리'],
            datasets: [{
                data: [eatenKcal, remainingKcal],
                backgroundColor: [
                    eatenKcal > goalKcal ? 'var(--accent-red)' : 'var(--primary-color)', // 목표 초과 시 빨간색
                    '#e9ecef' // 남은 부분
                ], 
                borderColor: 'var(--white)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: `오늘의 칼로리 목표: ${goalKcal} kcal`, font: { size: 16, weight: 'bold', family: 'Noto Sans KR' }, color: 'var(--text-dark)' },
                legend: { position: 'bottom', labels: { font: { family: 'Noto Sans KR' }, boxWidth: 15, padding: 20 } }
            },
            cutout: '70%', // 도넛 두께 조절
            layout: {
                padding: 10
            },
        }
    });
}

// v10 '막대 차트'
function renderMealChart(mealTotals) {
    const ctx = document.getElementById('mealBarChart').getContext('2d');

    // 그라데이션 생성
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(40, 167, 69, 0.8)');   // var(--primary-color)
    gradient.addColorStop(1, 'rgba(40, 167, 69, 0.2)');

    const borderGradient = ctx.createLinearGradient(0, 0, 0, 400);
    borderGradient.addColorStop(0, 'var(--primary-color)');
    borderGradient.addColorStop(1, 'var(--primary-dark)');

    mealBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['아침', '오전간식', '점심', '오후간식', '저녁', '야식'],
            datasets: [{
                label: '끼니별 섭취 Kcal',
                data: [
                    mealTotals.breakfast,
                    mealTotals.morningsnack,
                    mealTotals.lunch,
                    mealTotals.afternoonsnack,
                    mealTotals.dinner,
                    mealTotals.nightsnack
                ],
                backgroundColor: gradient, // 그라데이션 적용
                borderColor: borderGradient,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: '끼니별 칼로리 분석', font: { size: 16, weight: 'bold', family: 'Noto Sans KR' }, color: 'var(--text-dark)' },
                legend: { display: false } // 막대 하나라 범례 필요 없음
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Kcal', font: { family: 'Noto Sans KR' } } },
                x: { ticks: { font: { family: 'Noto Sans KR' } } }
            }
        }
    });
}


// --- 7. '초기화' 함수 (처음으로) ---
function restartApp() {
    // 입력값 초기화
    document.querySelectorAll('input[type="text"]').forEach(input => {
        input.value = '';
    });
    
    // 카운터 초기화
    document.querySelectorAll('.count-display').forEach(display => {
        display.textContent = '0';
    });
    
    // 활동량 선택 초기화
    document.querySelectorAll('.activity-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    selectedActivities.clear();
    
    // 차트 초기화
    if (calorieDonutChart) {
        calorieDonutChart.destroy();
        calorieDonutChart = null;
    }
    if (mealBarChart) {
        mealBarChart.destroy();
        mealBarChart = null;
    }
    
    // 결과 영역 초기화
    document.querySelectorAll('.result-box').forEach(box => {
        box.style.display = 'none';
    });
    
    // 저장 데이터 초기화
    localStorage.clear();
    sessionStorage.clear();
    
    // 첫 페이지로 이동
    showPage('page-bmi');
}


// --- 8. '앱 시작' (DOM 로드 후 1페이지 표시) ---
document.addEventListener('DOMContentLoaded', function() {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        showPage(savedPage);
    } else {
        showPage('page-bmi');
    }
});
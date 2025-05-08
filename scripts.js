// scripts.js

const board = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const restartButton = document.getElementById('restart-button');
const normalRowSound = document.getElementById('normal-row-sound');

const rows = 8;
const cols = 8;
const gemColors = ['blue-diamond-1', 'pink-diamond-1', 'green-gem-1', 'blue-gem-1', 'purple-gem-1'];
const specialGemClass = 'special';
let score = 0;

let gems = [];
let selectedGem = null;
let swapping = false;

function createBoard() {
    gems = [];
    board.innerHTML = ''; // Clear the board
    for (let i = 0; i < rows; i++) {
        gems[i] = [];
        for (let j = 0; j < cols; j++) {
            const gem = createGem(i, j);
            gems[i][j] = gem;
            board.appendChild(gem);
        }
    }
    removeInitialMatches();
}

function createGem(row, col) {
    const gem = document.createElement('div');
    gem.classList.add('gem');
    gem.classList.add(gemColors[Math.floor(Math.random() * gemColors.length)]);
    gem.dataset.row = row;
    gem.dataset.col = col;
    gem.addEventListener('click', handleGemClick);
    return gem;
}

function handleGemClick(event) {
    if (swapping) return;

    const gem = event.target;
    if (!selectedGem) {
        selectedGem = gem;
        gem.classList.add('highlight');
    } else {
        selectedGem.classList.remove('highlight');
        if (isAdjacent(selectedGem, gem)) {
            swapping = true;
            swapGems(selectedGem, gem);
            setTimeout(() => {
                if (!checkMatches()) {
                    swapGems(selectedGem, gem); // Swap back if no match
                } else {
                    handleMatches().then(() => {
                        updateBoard();
                        swapping = false;
                    });
                }
                swapping = false;
            }, 300);
        } else {
            selectedGem = gem;
            gem.classList.add('highlight');
        }
    }
}

function isAdjacent(gem1, gem2) {
    const row1 = parseInt(gem1.dataset.row);
    const col1 = parseInt(gem1.dataset.col);
    const row2 = parseInt(gem2.dataset.row);
    const col2 = parseInt(gem2.dataset.col);
    return (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1);
}

function swapGems(gem1, gem2) {
    const row1 = parseInt(gem1.dataset.row);
    const col1 = parseInt(gem1.dataset.col);
    const row2 = parseInt(gem2.dataset.row);
    const col2 = parseInt(gem2.dataset.col);

    [gems[row1][col1], gems[row2][col2]] = [gems[row2][col2], gems[row1][col1]];
    [gem1.dataset.row, gem2.dataset.row] = [gem2.dataset.row, gem1.dataset.row];
    [gem1.dataset.col, gem2.dataset.col] = [gem2.dataset.col, gem1.dataset.col];

    updateDOM();
}

function checkMatches() {
    let matches = findMatches();
    return matches.length > 0;
}

function findMatches() {
    let matches = [];
    // Find horizontal matches
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols - 2; j++) {
            const gem1 = gems[i][j];
            const gem2 = gems[i][j + 1];
            const gem3 = gems[i][j + 2];
            if (isMatch(gem1, gem2, gem3)) {
                matches.push([i, j], [i, j + 1], [i, j + 2]);
                if (j < cols - 3 && isMatch(gem1, gems[i][j + 3])) {
                    matches.push([i, j + 3]);
                    if (j < cols - 4 && isMatch(gem1, gems[i][j + 4])) {
                        matches.push([i, j + 4]);
                    }
                    // Create special candy for matching 4 or more blue diamonds in a row
                    if (j <= cols - 4 && gem1.classList.contains('blue-diamond-1')) {
                        gems[i][j + 2].className = 'gem ' + specialGemClass + ' ' + gem1.classList[1];
                    }
                }
            }
        }
    }
    // Find vertical matches
    for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows - 2; i++) {
            const gem1 = gems[i][j];
            const gem2 = gems[i + 1][j];
            const gem3 = gems[i + 2][j];
            if (isMatch(gem1, gem2, gem3)) {
                matches.push([i, j], [i + 1, j], [i + 2, j]);
                if (i < rows - 3 && isMatch(gem1, gems[i + 3][j])) {
                    matches.push([i + 3, j]);
                    if (i < rows - 4 && isMatch(gem1, gems[i + 4][j])) {
                        matches.push([i + 4, j]);
                    }
                    // Create special candy for matching 4 or more blue diamonds in a column
                    if (i <= rows - 4 && gem1.classList.contains('blue-diamond-1')) {
                        gems[i + 2][j].className = 'gem ' + specialGemClass + ' ' + gem1.classList[1];
                    }
                }
            }
        }
    }
    return matches;
}

function isMatch(gem1, gem2, gem3 = null) {
    if (!gem3) return gem1.classList[1] === gem2.classList[1] || gem1.classList.contains(specialGemClass) || gem2.classList.contains(specialGemClass);
    return (gem1.classList[1] === gem2.classList[1] && gem1.classList[1] === gem3.classList[1]) ||
        (gem1.classList.contains(specialGemClass) && gem2.classList[1] === gem3.classList[1]) ||
        (gem2.classList.contains(specialGemClass) && gem1.classList[1] === gem3.classList[1]);
}

function removeInitialMatches() {
    while (true) {
        let matches = findMatches();
        if (matches.length === 0) break;
        matches.forEach(([row, col]) => {
            const gem = gems[row][col];
            gem.className = 'gem ' + gemColors[Math.floor(Math.random() * gemColors.length)];
        });
    }
}

function removeMatches(matches) {
    const uniqueMatches = [...new Set(matches.map(JSON.stringify))].map(JSON.parse);
    uniqueMatches.forEach(([row, col]) => {
        const gem = gems[row][col];
        if (gem.classList.contains(specialGemClass) && gem.classList.contains('blue-diamond-1')) {
            activateSpecialGem(row, col);
        } else {
            gem.classList.add('remove');
            setTimeout(() => {
                gem.className = 'gem ' + gemColors[Math.floor(Math.random() * gemColors.length)];
                gem.classList.remove('remove');
            }, 300);
        }
    });
    playSound(normalRowSound);
    score += uniqueMatches.length;
    scoreDisplay.textContent = score;
}

function activateSpecialGem(row, col) {
    for (let i = 0; i < rows; i++) {
        gems[i][col].classList.add('remove');
    }
    for (let j = 0; j < cols; j++) {
        gems[row][j].classList.add('remove');
    }
    setTimeout(() => {
        for (let i = 0; i < rows; i++) {
            gems[i][col].className = 'gem ' + gemColors[Math.floor(Math.random() * gemColors.length)];
            gems[i][col].classList.remove('remove');
        }
        for (let j = 0; j < cols; j++) {
            gems[row][j].className = 'gem ' + gemColors[Math.floor(Math.random() * gemColors.length)];
            gems[row][j].classList.remove('remove');
        }
    }, 300);
    playSound(normalRowSound);
    score += (rows + cols) * 2; // Extra points for activating a special gem
    scoreDisplay.textContent = score;
}

function dropGems() {
    for (let col = 0; col < cols; col++) {
        let emptySlots = 0;
        for (let row = rows - 1; row >= 0; row--) {
            if (gems[row][col].classList.contains('remove')) {
                emptySlots++;
            } else if (emptySlots > 0) {
                let targetRow = row + emptySlots;
                gems[targetRow][col] = gems[row][col];
                gems[row][col] = createGem(row, col);
                gems[targetRow][col].dataset.row = targetRow;
                gems[targetRow][col].dataset.col = col;
            }
        }
        for (let row = 0; row < emptySlots; row++) {
            gems[row][col] = createGem(row, col);
            gems[row][col].dataset.row = row;
            gems[row][col].dataset.col = col;
        }
    }
    updateDOM();
}

function handleMatches() {
    return new Promise(resolve => {
        setTimeout(() => {
            const matches = findMatches();
            if (matches.length > 0) {
                removeMatches(matches);
                dropGems();
            }
            resolve();
        }, 300);
    });
}

function updateBoard() {
    if (checkMatches()) {
        handleMatches().then(updateBoard);
    }
}

function updateDOM() {
    board.innerHTML = '';
    gems.flat().forEach(gem => board.appendChild(gem));
}

function restartGame() {
    score = 0;
    scoreDisplay.textContent = score;
    selectedGem = null;
    swapping = false;
    createBoard();
}

function playSound(audioElement) {
    const soundClone = audioElement.cloneNode();
    soundClone.play();
}

restartButton.addEventListener('click', restartGame);

createBoard();

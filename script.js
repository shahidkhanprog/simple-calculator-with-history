document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const numberButtons = document.querySelectorAll('[data-number]');
    const operatorButtons = document.querySelectorAll('[data-operator]');
    const equalsButton = document.querySelector('[data-action="equals"]');
    const deleteButton = document.querySelector('[data-action="delete"]');
    const clearButton = document.querySelector('[data-action="clear"]');
    const previousOperandTextElement = document.getElementById('previous-operand');
    const currentOperandTextElement = document.getElementById('current-operand');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // --- Calculator Class ---
    class Calculator {
        constructor(previousOperandTextElement, currentOperandTextElement) {
            this.previousOperandTextElement = previousOperandTextElement;
            this.currentOperandTextElement = currentOperandTextElement;
            this.clear();
        }

        clear() {
            this.currentOperand = '0';
            this.previousOperand = '';
            this.operation = undefined;
        }

        delete() {
            // Remove the last character, ensuring it doesn't become an empty string
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
            if (this.currentOperand === '') {
                this.currentOperand = '0';
            }
        }

        appendNumber(number) {
            // Prevents multiple decimal points
            if (number === '.' && this.currentOperand.includes('.')) return;
            
            // Overwrite initial '0' unless the number is '.'
            if (this.currentOperand === '0' && number !== '.') {
                this.currentOperand = number.toString();
            } else {
                this.currentOperand = this.currentOperand.toString() + number.toString();
            }
        }

        chooseOperation(operation) {
            if (this.currentOperand === '0' && this.previousOperand === '') return;
            
            // Allows changing the operation before computing
            if (this.previousOperand !== '') {
                this.compute();
            }
            
            this.operation = operation;
            this.previousOperand = this.currentOperand;
            this.currentOperand = '0'; // Ready for new input
        }

        // --- Core Logic: Evaluation (AVOIDING eval()) ---
        compute() {
            let computation;
            const prev = parseFloat(this.previousOperand);
            const current = parseFloat(this.currentOperand);
            const expression = `${this.previousOperand} ${this.operationSymbol()} ${this.currentOperand}`;

            if (isNaN(prev) || isNaN(current)) return;

            switch (this.operation) {
                case 'add':
                    computation = prev + current;
                    break;
                case 'subtract':
                    computation = prev - current;
                    break;
                case 'multiply':
                    computation = prev * current;
                    break;
                case 'divide':
                    if (current === 0) {
                        computation = 'Error'; // Division by zero error
                    } else {
                        computation = prev / current;
                    }
                    break;
                default:
                    return;
            }

            // Store history before resetting
            if (computation !== 'Error') {
                this.addHistory(`${expression} = ${computation}`);
            }
            
            this.currentOperand = computation.toString();
            this.operation = undefined;
            this.previousOperand = '';
        }
        
        // Helper to get the correct symbol for display/history
        operationSymbol() {
            switch (this.operation) {
                case 'add': return '+';
                case 'subtract': return '−';
                case 'multiply': return '×';
                case 'divide': return '÷';
                default: return '';
            }
        }

        // --- Display Update & Formatting ---
        getDisplayNumber(number) {
            const stringNumber = number.toString();
            // Handle 'Error' case
            if (stringNumber === 'Error') return stringNumber;
            
            // Handle large number formatting
            const integerDigits = parseFloat(stringNumber.split('.')[0]);
            const decimalDigits = stringNumber.split('.')[1];
            let integerDisplay;
            
            if (isNaN(integerDigits)) {
                integerDisplay = '';
            } else {
                // Add commas for thousands separation
                integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
            }

            if (decimalDigits != null) {
                return `${integerDisplay}.${decimalDigits}`;
            } else {
                return integerDisplay;
            }
        }

        updateDisplay() {
            // Check for very long results and shrink font size
            if (this.currentOperand.length > 15) {
                currentOperandTextElement.classList.add('shrink');
            } else {
                currentOperandTextElement.classList.remove('shrink');
            }

            this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
            
            if (this.operation != null) {
                this.previousOperandTextElement.innerText = 
                    `${this.getDisplayNumber(this.previousOperand)} ${this.operationSymbol()}`;
            } else {
                this.previousOperandTextElement.innerText = '';
            }
        }

        // --- History Management ---
        loadHistory() {
            const history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
            this.history = history.slice(0, 10); // Limit to 10 entries
            this.renderHistory();
        }

        addHistory(entry) {
            this.history.unshift(entry); // Add to the start
            this.history = this.history.slice(0, 10); // Keep max 10
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
            this.renderHistory();
        }

        clearHistory() {
            this.history = [];
            localStorage.removeItem('calculatorHistory');
            this.renderHistory();
        }

        renderHistory() {
            historyList.innerHTML = ''; // Clear existing list
            
            if (this.history.length === 0) {
                historyList.innerHTML = '<p class="history-empty">No calculations yet.</p>';
                clearHistoryBtn.disabled = true;
                return;
            }
            
            clearHistoryBtn.disabled = false;
            
            this.history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.classList.add('history-item');
                historyItem.innerText = item;
                // Optional: Re-use history item as current calculation
                historyItem.addEventListener('click', () => {
                    const resultMatch = item.match(/= (.*)/);
                    if (resultMatch) {
                        this.clear();
                        this.currentOperand = resultMatch[1];
                        this.updateDisplay();
                    }
                });
                historyList.appendChild(historyItem);
            });
        }
    }

    // --- Instantiation and Initialization ---
    const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);
    calculator.loadHistory(); // Load history on startup

    // --- Event Listeners: Buttons ---
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            calculator.appendNumber(button.innerText);
            calculator.updateDisplay();
        });
    });

    operatorButtons.forEach(button => {
        button.addEventListener('click', () => {
            calculator.chooseOperation(button.getAttribute('data-operator'));
            calculator.updateDisplay();
        });
    });

    equalsButton.addEventListener('click', () => {
        calculator.compute();
        calculator.updateDisplay();
    });

    clearButton.addEventListener('click', () => {
        calculator.clear();
        calculator.updateDisplay();
    });

    deleteButton.addEventListener('click', () => {
        calculator.delete();
        calculator.updateDisplay();
    });
    
    clearHistoryBtn.addEventListener('click', () => {
        calculator.clearHistory();
    });

    // --- Extra Polishing: Dark/Light Theme Toggle ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerText = 'Light';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerText = isDark ? 'Light' : 'Dark';
    });

    // --- Extra Polishing: Keyboard Support ---
    document.addEventListener('keydown', (e) => {
        // Map keyboard keys to button actions
        let key = e.key;
        
        // Numbers and Decimal
        if ((key >= '0' && key <= '9') || key === '.') {
            calculator.appendNumber(key);
        } 
        // Operators
        else if (key === '+' || key === '-' || key === '*' || key === '/') {
            const operatorMap = {'+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide'};
            calculator.chooseOperation(operatorMap[key]);
        }
        // Equals/Enter
        else if (key === '=' || key === 'Enter') {
            e.preventDefault(); // Prevent default action (e.g., submitting a form)
            calculator.compute();
        }
        // Delete/Backspace
        else if (key === 'Backspace') {
            calculator.delete();
        }
        
        calculator.updateDisplay();
    });
});
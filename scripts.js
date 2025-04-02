let transactions = [];
let nextId = 1;
let savings = 0;
let editMode = false;
let editId = null;
let transactionChart, balanceChart, savingsChart, expenseCategoryChart, additionalChart1, additionalChart2, goalChart;
let budgetVsActualChart;
let allTransactions = [];
let filteredTransactions = transactions; // Declare once at the top



// Load transactions from localStorage
function loadTransactions() {
    try {
        const savedTransactions = localStorage.getItem('transactions');
        if (savedTransactions) {
            transactions = JSON.parse(savedTransactions);
            filteredTransactions = transactions; // Initially show all transactions
            
            // Reindex IDs starting from 1
            transactions = transactions.map((transaction, index) => ({
                ...transaction,
                id: index + 1 // Reassign IDs starting from 1
            }));

            // Set nextId to the next available ID after reindexing
            nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;

            updateTable();
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
    return transactions;
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving transactions:', error);
    }
}
// Add or update a transaction
function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;

    if (description && amount && date && type && category) {
        if (editMode) {
            // Update existing transaction
            const transaction = transactions.find(t => t.id === editId);
            transaction.description = description;
            transaction.amount = parseFloat(amount).toFixed(2);
            transaction.date = date;
            transaction.type = type;
            transaction.category = category;
            editMode = false;
            editId = null;
        } else {
            // Add new transaction with the correct nextId
            const transaction = {
                id: nextId++,  // Use nextId and increment it
                description,
                amount: parseFloat(amount).toFixed(2),
                date,
                type,
                category
            };
            transactions.push(transaction);
        }

        filteredTransactions = transactions; // Reset filter
        saveTransactions();
        updateTable();
        document.getElementById('transactionForm').reset();
    } else {
        alert('Please fill in all blanks!');
    }
}


// Edit a transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('date').value = transaction.date;
    document.getElementById('type').value = transaction.type;
    document.getElementById('category').value = transaction.category;
    editMode = true;
    editId = id;
}
// Delete a transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        // Step 1: Remove the transaction from the transactions array
        transactions = transactions.filter(transaction => transaction.id !== id);
        filteredTransactions = transactions; // Reset filter

        // Step 2: Reindex all transactions to start from ID 1
        transactions = transactions.map((transaction, index) => ({
            ...transaction,
            id: index + 1  // Reassign IDs starting from 1
        }));

        // Step 3: Set nextId to the next available ID
        nextId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;

        // Step 4: Save the updated transactions array back to localStorage
        saveTransactions();
        
        // Step 5: Update the table (UI)
        updateTable();

        alert('Deleted successfully!');
    }
}

function filterTransactionsByYear() {
    const selectedYear = document.getElementById('yearSelect').value;

    if (selectedYear === 'all') {
        filteredTransactions = transactions;
    } else {
        filteredTransactions = transactions.filter(transaction => {
            const transactionYear = transaction.date.split('-')[0];
            return transactionYear === selectedYear;
        });
    }

    filterTransactionsByMonth(); // Apply month filter after year filter
}

function filterTransactionsByMonth() {
    const selectedMonth = document.getElementById('monthSelect').value;

    if (selectedMonth === 'all') {
        filteredTransactions = transactions.filter(transaction => {
            const transactionYear = document.getElementById('yearSelect').value;
            return transactionYear === 'all' || transaction.date.split('-')[0] === transactionYear;
        });
    } else {
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionMonth = transaction.date.split('-')[1];
            return transactionMonth === selectedMonth;
        });
    }

    updateTable();
}

// Add event listeners to call the filter functions when the year or month is changed
document.getElementById('yearSelect').addEventListener('change', filterTransactionsByYear);
document.getElementById('monthSelect').addEventListener('change', filterTransactionsByMonth);

// Update the table and calculations
function updateTable() {
    const tableBody = document.getElementById('transactionTable');
    tableBody.innerHTML = '';

    let totalIncome = 0;
    let totalExpense = 0;

    // Category totals for doughnut chart
let categoryTotals = {
    salary: 0,
    groceries: 0,
    rent: 0,
    utilities: 0,
    transportation: 0,
    healthcare: 0,
    diningOut: 0,
    shopping: 0,
    clothes: 0,
    entertainment: 0,
    personalCare: 0,
    car: 0,
    travel: 0,
    gift: 0,
    investment: 0,
    otherIncome: 0,
    otherExpense: 0
};


    const fragment = document.createDocumentFragment();

    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                ${transaction.amount} €
            </td>
            <td>${transaction.date}</td>
            <td>${transaction.type === 'income' ? 'Income' : 'Expense'}</td>
            <td>${getCategoryLabel(transaction.category)}</td>
            <td>
                <button onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit edit-icon"></i> <!-- Green Edit Icon -->
                </button>
                <button onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash-alt delete-icon"></i> <!-- Red Trash Icon -->
                </button>
            </td>
            <td><input type="checkbox" class="transaction-checkbox" data-id="${transaction.id}"></td>
        `;
        fragment.appendChild(row);

        if (transaction.type === 'income') {
            totalIncome += parseFloat(transaction.amount);
        } else if (transaction.type === 'expense') {
            totalExpense += parseFloat(transaction.amount);
            if (categoryTotals[transaction.category] !== undefined) {
                categoryTotals[transaction.category] += parseFloat(transaction.amount);
            }
        }
    });

    tableBody.appendChild(fragment);

    const balance = savings + totalIncome - totalExpense;

    // Update display
    document.getElementById('totalIncome').innerText = `${totalIncome.toFixed(2)} €`;
    document.getElementById('totalExpense').innerText = `${totalExpense.toFixed(2)} €`;
    document.getElementById('balance').innerText = `${balance.toFixed(2)} €`;

    updateCharts(totalIncome, totalExpense, balance, categoryTotals);
}

// Get category label
function getCategoryLabel(category) {
    const categories = {
        salary: 'Salary',
        groceries: 'Groceries',
        rent: 'Rent',
        utilities: 'Utilities',
        transportation: 'Transportation',
        healthcare: 'Healthcare',
        diningOut: 'Dining Out',
        shopping: 'Shopping',
        clothes: 'Clothes',
        entertainment: 'Entertainment',
        personalCare: 'Personal Care',
        car: 'Car',
        travel: 'Travel',
        gift: 'Gift',
        investment: 'Investment',
        otherIncome: 'Other Income',
        otherExpense: 'Other Expense'
    };
    return categories[category] || 'Unknown';
}


// Update charts
function updateCharts(totalIncome, totalExpense, balance, categoryTotals) {
    const ctx1 = document.getElementById('transactionChart').getContext('2d');
    const ctx2 = document.getElementById('balanceChart').getContext('2d');
    const ctx3 = document.getElementById('savingsChart').getContext('2d');
    const ctx4 = document.getElementById('expenseCategoryChart').getContext('2d');
    const ctx5 = document.getElementById('additionalChart1').getContext('2d');
    const ctx6 = document.getElementById('additionalChart2').getContext('2d');
    if (transactionChart) transactionChart.destroy();
    if (balanceChart) balanceChart.destroy();
    if (savingsChart) savingsChart.destroy();
    if (expenseCategoryChart) expenseCategoryChart.destroy();
    if (additionalChart1) additionalChart1.destroy();
    if (additionalChart2) additionalChart2.destroy();

    function calculateBalance(transactions) {
        const balanceData = [];
        const monthBalances = {}; // Store balance by month
    
        transactions.forEach(transaction => {
            const month = new Date(transaction.date).toISOString().slice(0, 7); // Get 'YYYY-MM' format
            if (!monthBalances[month]) {
                monthBalances[month] = 0;
            }
            monthBalances[month] += transaction.amount; // Add income or expense
        });
    
        // Now calculate the cumulative balance over time
        let cumulativeBalance = 0;
        for (let month in monthBalances) {
            cumulativeBalance += monthBalances[month];
            balanceData.push({ month: month, balance: cumulativeBalance });
        }
    
        // Sort by month (ascending)
        balanceData.sort((a, b) => a.month.localeCompare(b.month));
    
        return balanceData;
    }
    
    // Generate the balance data
    const balanceData = calculateBalance(transactions);
    console.log("Generated Balance Data: ", balanceData);
    // Prepare data for the chart
    const months = balanceData.map(item => item.month);
    const balances = balanceData.map(item => item.balance);
    if (!months.length || !balances.length) {
        console.error("No valid balance data found!");
    }

    // Function to group transactions by date and sum amounts
function groupTransactionsByDate(transactions) {
    const grouped = {};
    transactions.forEach(trx => {
        const date = trx.date;
        if (!grouped[date]) {
            grouped[date] = { income: 0, expense: 0 };
        }
        if (trx.type === 'income') {
            grouped[date].income += parseFloat(trx.amount);
        } else {
            grouped[date].expense += parseFloat(trx.amount);
        }
    });
    return grouped;
}

// Grouped transactions
const groupedTransactions = groupTransactionsByDate(filteredTransactions);

// Extract dates, incomes, and expenses
const dates = Object.keys(groupedTransactions).sort((a, b) => new Date(a) - new Date(b));
const incomes = dates.map(date => groupedTransactions[date].income);
const expenses = dates.map(date => groupedTransactions[date].expense);

    transactionChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [totalIncome, totalExpense],
                backgroundColor: ['#388E3C', '#FF0000'],
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Income and Expense'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toFixed(2) + ' €';
                        }
                    }
                }
            }
        }
    });
    balanceChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [totalIncome, totalExpense],
                backgroundColor: ['#388E3C', '#FF0000'],
            }]
        },
        options: {
            plugins: {
                legend: { 
                    display: false // This will hide the legend
                },
                title: {
                    display: true,
                    text: 'Income and Expense'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €';
                        }
                    }
                }
            }
        }
    });
// Update your charts with the grouped data
savingsChart = new Chart(ctx3, {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
            label: 'Savings (€)',
            data: dates.map(date => {
                let balance = 0;
                dates.forEach(d => {
                    if (d <= date) {
                        balance += groupedTransactions[d].income - groupedTransactions[d].expense;
                    }
                });
                return balance;
                }),
                fill: false,
                borderColor: '#FFA500',
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Savings in Time'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €';
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Savings (€)' } }
            }
        }
    });

    expenseCategoryChart = new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: ['Salary', 'Groceries', 'Rent', 'Utilities', 'Transportation', 'Healthcare', 'Dining Out', 'Shopping', 'Clothes', 'Entertainment', 'Personal Care', 'Car', 'Travel', 'Gift', 'Investment', 'Other Income', 'Other Expense'],
            datasets: [{
                data: [
                    categoryTotals.salary,
                    categoryTotals.groceries,
                    categoryTotals.rent,
                    categoryTotals.utilities,
                    categoryTotals.transportation,
                    categoryTotals.healthcare,
                    categoryTotals.diningOut,
                    categoryTotals.shopping,
                    categoryTotals.clothes,
                    categoryTotals.entertainment,
                    categoryTotals.personalCare,
                    categoryTotals.car,
                    categoryTotals.travel,
                    categoryTotals.gift,
                    categoryTotals.investment,
                    categoryTotals.otherIncome,
                    categoryTotals.otherExpense
    
                ],
                backgroundColor: [
                    '#FFEB3B', '#FF9800', '#2196F3', '#9C27B0', '#4CAF50', '#F44336', '#E91E63', '#00BCD4', '#8BC34A', '#CDDC39', '#FFC107', '#795548', '#607D8B', '#9E9E9E', '#3F51B5', '#673AB7', '#FF5722'
                ],
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Expenses by Category'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €';
                        }
                    }
                }
            }
        }
    });

    // New Additional Chart 1 - example: Monthly income vs. expense chart
    additionalChart1 = new Chart(ctx5, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Income (€)',
                    data: incomes,
                    borderColor: '#388E3C',
                    fill: false
                },
                {
                    label: 'Expense (€)',
                    data: expenses,
                    borderColor: '#FF0000',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Monthly Income and Expenses'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €';
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Price (€)' } }
            }
        }
    });

    additionalChart2 = new Chart(ctx6, {
        type: 'bar',
        data: {
            labels: dates, // Month labels
            datasets: [{
                label: 'Balance (€)',
                data: dates.map((month, index) => {
                    // Calculate cumulative balance for each month
                    let balance = 0;
                    for (let i = 0; i <= index; i++) {
                        balance += groupedTransactions[dates[i]].income - groupedTransactions[dates[i]].expense;
                    }
                    return balance; // Return cumulative balance for that month
                }),
                backgroundColor: '#3b82f6', // Blue bars for balance
            }]
        },
        options: {
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Monthly Balance (€)' // Chart title
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €'; // Tooltip with € sign
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true } // Start Y axis at zero
            }
        }
    });
    

}

// Function to export transactions to Excel
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
        ID: t.id,
        Description: t.description,
        Price: t.amount,
        Date: t.date,
        Type: t.type === 'income' ? 'Income' : 'Expense',
        Category: getCategoryLabel(t.category),
    })));
    
    XLSX.utils.book_append_sheet(wb, ws, "Wealth_Wise");
    XLSX.writeFile(wb, 'wealth_wise.xlsx');
}


// Load transactions from localStorage on page load (if any)
window.onload = function() {
    allTransactions = loadTransactions();
    displayTransactions(allTransactions);
}

function clearAllData() {
    localStorage.removeItem('transactions');
    allTransactions = [];
    displayTransactions();
    alert("All data cleared!");
}

// Filter transactions by type (income or expense)
function filterTransactions(type) {
    const filteredTransactions = allTransactions.filter(transaction => transaction.type === type);
    displayTransactions(filteredTransactions);
}

// Sort transactions by date
function sortTransactionsByDate() {
    const sorted = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    displayTransactions(sorted);
}

// Sort transactions by amount
function sortTransactionsByAmount() {
    const sorted = [...allTransactions].sort((a, b) => a.amount - b.amount);
    displayTransactions(sorted);
}

document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('goalChart').getContext('2d');
    goalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Savings'], // Single label for the savings
            datasets: [
                {
                    label: 'Goal (€)', // Goal as background
                    data: [0], // Initial goal value
                    backgroundColor: 'rgba(76, 175, 79, 0.57)', // Light green color with reduced opacity for background goal bar
                    borderColor: '#4caf50',
                    borderWidth: 1,
                    barPercentage: 1.0, // Full width for the goal bar
                    categoryPercentage: 1.0, // Full width for the goal bar
                    stack: 'stack1', // Stack identifier for this dataset
                    borderSkipped: false, // To make sure the border is visible
                },
                {
                    label: 'Savings (€)', // Savings as the top bar
                    data: [0], // Start savings at 0€
                    backgroundColor: '#000', // Black color for savings bar
                    barPercentage: 1.0,
                    categoryPercentage: 1.0, // Full width for the goal bar
                    borderColor: '#000',
                    borderWidth: 2, // Make savings bar more prominent
                    stack: 'stack1', // Stack identifier for this dataset
                    borderSkipped: false, // To ensure the border appears on both bars
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' €';
                        }
                    }
                },
                datalabels: {
                    display: true,
                    align: 'end',
                    anchor: 'end',
                    formatter: function(value, context) {
                        const goal = parseFloat(document.getElementById('goal').value) || 0;
                        const totalSavings = value;
                        const percentageCompleted = (totalSavings / goal) * 100;
                        return percentageCompleted.toFixed(2) + '%';
                    },
                    color: function(context) {
                        const goal = parseFloat(document.getElementById('goal').value) || 0;
                        const totalSavings = context.dataset.data[0];
                        const percentageCompleted = (totalSavings / goal) * 100;
                        return percentageCompleted >= 0 ? 'green' : 'red';
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    stacked: false, // Stack the bars
                },
                y: {
                    beginAtZero: true,
                    stacked: false, // Stack the bars
                    ticks: {
                        stepSize: 1000, // Step size for the y-axis ticks
                        callback: function(value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });

    window.updateChart = function () {
        const goal = parseFloat(document.getElementById('goal').value) || 0;
        const balance = parseFloat(document.getElementById('balance').innerText.replace(' €', '')) || 0;
        const otherSavings = parseFloat(document.getElementById('otherSavings').value) || 0;
    
        const totalSavings = balance + otherSavings;
        const percentageCompleted = (totalSavings / goal) * 100;
    
        goalChart.data.datasets[0].data = [goal];
        goalChart.data.datasets[1].data = [totalSavings];
        goalChart.options.scales.y.max = Math.max(goal, totalSavings);
        goalChart.update();
    
        document.getElementById('totalSavings').innerText = totalSavings.toFixed(2) + ' €';
        const percentageElement = document.getElementById('percentage');
        percentageElement.innerText = percentageCompleted.toFixed(2) + '% completed';
        percentageElement.style.color = percentageCompleted >= 0 ? 'green' : 'red';
        // Save the values to localStorage
        localStorage.setItem('savings', otherSavings);
        localStorage.setItem('savingsGoal', goal);
    };

    // Load the values from localStorage if available on page load
    window.addEventListener("load", function () {
        const savingsInput = document.getElementById('otherSavings');
        const goalInput = document.getElementById('goal');
    
        // Retrieve and populate the saved values from localStorage
        const savedSavings = localStorage.getItem('savings');
        const savedGoal = localStorage.getItem('savingsGoal');
    
        if (savedSavings) {
            savingsInput.value = savedSavings;
        }
        if (savedGoal) {
            goalInput.value = savedGoal;
        }
    
        // Initialize the graph with loaded data
        updateChart();
    });
    });

// Load transactions when the page loads
loadTransactions();

function displayTransactions(transactions) {
    const tableBody = document.getElementById('transactionTable');
    tableBody.innerHTML = '';

    let totalIncome = 0;
    let totalExpense = 0;

// Category totals for doughnut chart
let categoryTotals = {
    salary: 0,
    groceries: 0,
    rent: 0,
    utilities: 0,
    transportation: 0,
    healthcare: 0,
    diningOut: 0,
    shopping: 0,
    clothes: 0,
    entertainment: 0,
    personalCare: 0,
    car: 0,
    travel: 0,
    gift: 0,
    investment: 0,
    otherIncome: 0,
    otherExpense: 0
};


    const fragment = document.createDocumentFragment();

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.description}</td>
            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">
                ${transaction.amount} €
            </td>
            <td>${transaction.date}</td>
            <td>${transaction.type === 'income' ? 'Income' : 'Expense'}</td>
            <td>${getCategoryLabel(transaction.category)}</td>
            <td>
                <button onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit edit-icon"></i> <!-- Green Edit Icon -->
                </button>
                <button onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash-alt delete-icon"></i> <!-- Red Trash Icon -->
                </button>
            </td>
            <td><input type="checkbox" class="transaction-checkbox" data-id="${transaction.id}"></td>
        `;
        fragment.appendChild(row);

        if (transaction.type === 'income') {
            totalIncome += parseFloat(transaction.amount);
        } else if (transaction.type === 'expense') {
            totalExpense += parseFloat(transaction.amount);
            if (categoryTotals[transaction.category] !== undefined) {
                categoryTotals[transaction.category] += parseFloat(transaction.amount);
            }
        }
    });

    tableBody.appendChild(fragment);

    const balance = totalIncome - totalExpense;

    // Update display
    document.getElementById('totalIncome').innerText = `${totalIncome.toFixed(2)} €`;
    document.getElementById('totalExpense').innerText = `${totalExpense.toFixed(2)} €`;
    document.getElementById('balance').innerText = `${balance.toFixed(2)} €`;

    updateCharts(totalIncome, totalExpense, balance, categoryTotals);
}

function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an Excel file first.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Assuming the first sheet contains the transaction data
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Parse and add the data to the table
        jsonData.forEach(row => {
            const description = row['Description'] || 'Unknown';
            const amount = row['Price'] || 0;
            const date = row['Date'] || 'Unknown';
            const type = row['Type'] === 'Income' ? 'income' : 'expense';
            const categoryLabel = row['Category'];
            console.log('Category:', categoryLabel); // Log category for debugging
            const category = mapCategory(categoryLabel);
        
            addTransactionFromExcel(description, amount, date, type, category);
        });

        alert('Transactions successfully uploaded!');
    };

    reader.onerror = function(error) {
        console.error(error);
        alert('Error reading the file.');
    };

    reader.readAsBinaryString(file);
}

function mapCategory(categoryLabel) {
    const categoryMap = {
        'Salary': 'salary',
        'Investment': 'investment',
        'Gift': 'gift',
        'Other Income': 'otherIncome',
        'Groceries': 'groceries',
        'Rent': 'rent',
        'Utilities': 'utilities',
        'Transportation': 'transportation',
        'Entertainment': 'entertainment',
        'Healthcare': 'healthcare',
        'Dining Out': 'diningOut',
        'Shopping': 'shopping',
        'Clothes': 'clothes',
        'Personal Care': 'personalCare',
        'Car': 'car',
        'Travel': 'travel',
        'Other Expense': 'otherExpense'
    };

    return categoryMap[categoryLabel] || 'otherExpense';
}

function addTransactionFromExcel(description, amount, date, type, category) {
    const transaction = {
        id: nextId++,
        description,
        amount: parseFloat(amount).toFixed(2),
        date,
        type,
        category
    };
    transactions.push(transaction);
    filteredTransactions = transactions; // Reset filter
    saveTransactions();
    updateTable();
}


function deleteSelectedTransactions() {
    const checkboxes = document.querySelectorAll('.transaction-checkbox:checked');
    const idsToDelete = Array.from(checkboxes).map(checkbox => parseInt(checkbox.getAttribute('data-id')));

    if (idsToDelete.length === 0) {
        alert('Please select at least one transaction to delete.');
        return;
    }

    if (confirm('Are you sure you want to delete the selected transactions?')) {
        transactions = transactions.filter(transaction => !idsToDelete.includes(transaction.id));
        filteredTransactions = transactions; // Reset filter
        saveTransactions();
        updateTable();
        alert('Selected transactions deleted successfully!');
    }
}

// Function to toggle all checkboxes
function toggleSelectAll(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.transaction-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// Sort transactions by month
function sortByMonth(order) {
    filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
    updateTable();
}

// Sort transactions by amount
function sortByAmount(order) {
    filteredTransactions.sort((a, b) => {
        const amountA = parseFloat(a.amount);
        const amountB = parseFloat(b.amount);
        return order === 'asc' ? amountA - amountB : amountB - amountA;
    });
    updateTable();
}

// Sort transactions by type
function sortByType(order) {
    filteredTransactions.sort((a, b) => {
        const typeA = a.type.toLowerCase();
        const typeB = b.type.toLowerCase();
        return order === 'asc' ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
    });
    updateTable();
}

// Initialize the chart variable outside any function

window.onload = function() {
    // Check if there's a saved savings goal in localStorage
    const savedBudgetGoal = localStorage.getItem('budgetGoal');
    
    // If we have a saved savings goal, set it in the input field
    if (savedBudgetGoal !== null) {
        document.getElementById('budgetGoal').value = savedBudgetGoal;
    }
    
    // Calculate monthly wage based on salary transactions
    calculateMonthlyWage();
}

function calculateMonthlyWage() {
    // Update the button label to indicate calculation is in progress
    const button = document.getElementById('calculateBudgetButton');
    button.innerText = 'Calculating...';
    button.disabled = true; // Disable the button to prevent multiple clicks

    // Perform the calculation (replace with your actual calculation logic)
    const salaryTransactions = transactions.filter(transaction => transaction.category === 'salary');
    if (salaryTransactions.length === 0) {
        alert('No salary transactions found. Please enter salary transactions.');
        button.innerText = 'Calculate Budget';
        button.disabled = false;
        return;
    }

    const totalSalary = salaryTransactions.reduce((total, transaction) => total + parseFloat(transaction.amount), 0);
    const averageSalary = totalSalary / salaryTransactions.length;

    // Update the monthly wage input field with the calculated average salary
    document.getElementById('monthlyWage').value = averageSalary.toFixed(2);

    // Re-enable the button and update its label
    button.innerText = 'Calculate Budget';
    button.disabled = false;

    // Trigger budget calculation after setting the monthly wage
    calculateBudget();
}

function calculateBudget() {
    const monthlyWage = parseFloat(document.getElementById('monthlyWage').value);
    const budgetGoal = parseFloat(document.getElementById('budgetGoal').value);

    if (isNaN(monthlyWage) || isNaN(budgetGoal) || monthlyWage <= 0 || budgetGoal < 0) {
        alert('Please enter valid amounts for monthly wage and savings goal.');
        return;
    }

    // Save the budget goal to localStorage
    localStorage.setItem('budgetGoal', budgetGoal);

    const remainingAmount = monthlyWage - budgetGoal;

    // Professional financial advisor percentages
    const budgetPercentages = {
        investment: 10,
        gift: 5,
        groceries: 15,
        diningOut: 5,
        utilities: 10,
        rent: 30,
        transportation: 10,
        healthcare: 10,
        entertainment: 10,
        shopping: 5,
        clothes: 5,
        car: 5,
        personalCare: 5,
        travel: 5,
        otherExpense: 10

    
    };

    const budgetAmounts = {
        investment: (remainingAmount * budgetPercentages.investment) / 100,
        gift: (remainingAmount * budgetPercentages.gift) / 100,
        groceries: (remainingAmount * budgetPercentages.groceries) / 100,
        diningOut: (remainingAmount * budgetPercentages.diningOut) / 100,
        utilities: (remainingAmount * budgetPercentages.utilities) / 100,
        rent: (remainingAmount * budgetPercentages.rent) / 100,
        transportation: (remainingAmount * budgetPercentages.transportation) / 100,
        healthcare: (remainingAmount * budgetPercentages.healthcare) / 100,
        entertainment: (remainingAmount * budgetPercentages.entertainment) / 100,
        shopping: (remainingAmount * budgetPercentages.shopping) / 100,
        clothes: (remainingAmount * budgetPercentages.clothes) / 100,
        car: (remainingAmount * budgetPercentages.car) / 100,
        personalCare: (remainingAmount * budgetPercentages.personalCare) / 100,
        travel: (remainingAmount * budgetPercentages.travel) / 100,
        otherExpense: (remainingAmount * budgetPercentages.otherExpense) / 100
    };
    
    
    document.getElementById('budgetInvestment').innerText = `${budgetAmounts.investment.toFixed(2)} €`;
    document.getElementById('budgetGift').innerText = `${budgetAmounts.gift.toFixed(2)} €`;
    document.getElementById('budgetGroceries').innerText = `${budgetAmounts.groceries.toFixed(2)} €`;
    document.getElementById('budgetDiningOut').innerText = `${budgetAmounts.diningOut.toFixed(2)} €`;
    document.getElementById('budgetUtilities').innerText = `${budgetAmounts.utilities.toFixed(2)} €`;
    document.getElementById('budgetRent').innerText = `${budgetAmounts.rent.toFixed(2)} €`;
    document.getElementById('budgetTransportation').innerText = `${budgetAmounts.transportation.toFixed(2)} €`;
    document.getElementById('budgetHealthcare').innerText = `${budgetAmounts.healthcare.toFixed(2)} €`;
    document.getElementById('budgetEntertainment').innerText = `${budgetAmounts.entertainment.toFixed(2)} €`;
    document.getElementById('budgetShopping').innerText = `${budgetAmounts.shopping.toFixed(2)} €`;
    document.getElementById('budgetClothes').innerText = `${budgetAmounts.clothes.toFixed(2)} €`;
    document.getElementById('budgetCar').innerText = `${budgetAmounts.car.toFixed(2)} €`;
    document.getElementById('budgetPersonalCare').innerText = `${budgetAmounts.personalCare.toFixed(2)} €`;
    document.getElementById('budgetTravel').innerText = `${budgetAmounts.travel.toFixed(2)} €`;
    document.getElementById('budgetOtherExpense').innerText = `${budgetAmounts.otherExpense.toFixed(2)} €`;
    
    displayCategoryAmounts(budgetAmounts);
    
}

function displayCategoryAmounts(budgetAmounts) {
    const categoryTotals = {
        
    salary: 0,
    groceries: 0,
    rent: 0,
    utilities: 0,
    transportation: 0,
    healthcare: 0,
    diningOut: 0,
    shopping: 0,
    clothes: 0,
    entertainment: 0,
    personalCare: 0,
    car: 0,
    travel: 0,
    gift: 0,
    investment: 0,
    otherIncome: 0,
    otherExpense: 0

    };

    // Assuming 'transactions' is defined elsewhere
    transactions.forEach(transaction => {
        if (transaction.type === 'expense' && categoryTotals[transaction.category] !== undefined) {
            categoryTotals[transaction.category] += parseFloat(transaction.amount);
        }
    });

    const categoryAmountsDiv = document.getElementById('categoryAmounts');
    categoryAmountsDiv.innerHTML = '';

    for (const category in categoryTotals) {
        const categoryLabel = getCategoryLabel(category);
        const amount = categoryTotals[category].toFixed(2);
        const categoryDiv = document.createElement('div');
        categoryDiv.innerHTML = `<strong>${categoryLabel}:</strong> ${amount} €`;
        categoryAmountsDiv.appendChild(categoryDiv);
    }

    // Create the budget vs actual chart
    createBudgetVsActualChart(budgetAmounts, categoryTotals);
}

function createBudgetVsActualChart(budgetAmounts, categoryTotals) {
    const ctx = document.getElementById('budgetVsActualChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (budgetVsActualChart) {
        budgetVsActualChart.destroy();
    }

    // Create new chart
    budgetVsActualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [ 'Groceries', 'Rent', 'Utilities', 'Transportation', 'Healthcare', 'Dining Out', 'Shopping', 'Clothes', 'Entertainment', 'Personal Care', 'Car', 'Travel', 'Gift', 'Investment', 'Other Expense'],
            datasets: [
                {
                    label: 'Budgeted Amount (€)',
                    data: [
                        
                        budgetAmounts.groceries,
                        budgetAmounts.rent,
                        budgetAmounts.utilities,
                        budgetAmounts.transportation,
                        budgetAmounts.healthcare,
                        budgetAmounts.diningOut,
                        budgetAmounts.shopping,
                        budgetAmounts.clothes,
                        budgetAmounts.entertainment,
                        budgetAmounts.personalCare,
                        budgetAmounts.car,
                        budgetAmounts.travel,
                        budgetAmounts.gift,
                        budgetAmounts.investment,
                        budgetAmounts.otherExpense
                        
                    ],
                    backgroundColor: 'rgba(76, 175, 79, 0.57)',
                    borderColor: '#4caf50',
                    borderWidth: 1
                },
                {
                    label: 'Actual Spending (€)',
                    data: [
                        categoryTotals.groceries,
                        categoryTotals.rent,
                        categoryTotals.utilities,
                        categoryTotals.transportation,
                        categoryTotals.healthcare,
                        categoryTotals.diningOut,
                        categoryTotals.shopping,
                        categoryTotals.clothes,
                        categoryTotals.entertainment,
                        categoryTotals.personalCare,
                        categoryTotals.car,
                        categoryTotals.travel,
                        categoryTotals.gift,
                        categoryTotals.investment,
                        categoryTotals.otherExpense
                    ],
                    backgroundColor: '#FF0000',
                    borderColor: '#FF0000',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: {
                    display: true,
                    text: 'Budget vs Actual Spending'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toFixed(2) + ' €';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' €';
                        }
                    }
                }
            }
        }
    });
}

function getCategoryLabel(category) {
    const categoryLabels = {
        salary: 'Salary',
        investment: 'Investment',
        gift: 'Gift',
        otherIncome: 'Other Income',
        groceries: 'Groceries',
        rent: 'Rent',
        utilities: 'Utilities',
        transportation: 'Transportation',
        entertainment: 'Entertainment',
        healthcare: 'Healthcare',
        diningOut: 'Dining Out',
        shopping: 'Shopping',
        clothes: 'Clothes',
        personalCare: 'Personal Care',
        car: 'Car',
        travel: 'Travel',
        otherExpense: 'Other Expense'

    };
    return categoryLabels[category] || category;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Open the default tab
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.tablinks').click();
});

$(document).ready(function(){
    // Initialize the Slick carousel
    $('.carousel').slick({
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        adaptiveHeight: true,
        prevArrow: '<button type="button" class="slick-prev">Previous</button>',
        nextArrow: '<button type="button" class="slick-next">Next</button>'
    });

    // Collapsible form functionality
    var coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }

    // Collapsible form functionality
    var coll = document.getElementsByClassName("colltable");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
});


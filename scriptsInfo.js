let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let filteredTransactions = transactions;
let nextId = transactions.length + 1;

function formatCategoryName(category) {
    return category.replace(/([a-z])([A-Z])/g, '$1 $2')
                   .replace(/\b\w/g, char => char.toUpperCase());
}

function updateSummaryTable(transactions) {
    let totalIncome = 0;
    let totalExpense = 0;
    let categoryTotals = {};

    transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
            totalIncome += amount;
        } else if (transaction.type === 'expense') {
            totalExpense += amount;
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += amount;
        }
    });

    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').innerText = `${totalIncome.toFixed(2)} €`;
    document.getElementById('totalExpense').innerText = `${totalExpense.toFixed(2)} €`;
    document.getElementById('balance').innerText = `${balance.toFixed(2)} €`;

    const categoryPercentages = Object.entries(categoryTotals)
        .map(([category, total]) => [category, (total / totalExpense) * 100])
        .filter(([, percentage]) => percentage > 0)
        .sort((a, b) => b[1] - a[1]);

    const categoriesTableBody = document.getElementById('categoriesTableBody');
    categoriesTableBody.innerHTML = '';

    categoryPercentages.forEach(([category, percentage]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatCategoryName(category)}</td>
            <td>€${categoryTotals[category].toFixed(2)}</td>
            <td>${percentage.toFixed(2)}%</td>
        `;
        categoriesTableBody.appendChild(row);
    });
}

function updateTable() {
    updateSummaryTable(filteredTransactions);
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

// Initial load
updateTable();


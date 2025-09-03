document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const resultContainer = document.getElementById('resultContainer');

    // Обновляет текст кнопки при выборе файла
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileLabel.textContent = fileInput.files[0].name;
            submitBtn.disabled = false;
        } else {
            fileLabel.textContent = 'Выберите файл';
            submitBtn.disabled = true;
        }
    });

    // Обработка отправки формы
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            statusMessage.textContent = 'Пожалуйста, выберите файл.';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Display loading status
        statusMessage.textContent = 'Обрабатываю чек, пожалуйста, подождите...';
        resultContainer.innerHTML = '';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/process-receipt', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                statusMessage.textContent = '✅ Чек успешно обработан!';
                
                // Clean the string by removing ```json\n and ```
                const rawJsonString = data.data.replace(/```json\n|```/g, '').trim();

                // Parse the cleaned JSON string
                const gptData = JSON.parse(rawJsonString);

                // Display the data in a formatted way
                displayFormattedData(gptData);

            } else {
                statusMessage.textContent = `❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`;
                resultContainer.innerHTML = '';
            }
        } catch (error) {
            statusMessage.textContent = `❌ Ошибка сети: ${error.message}`;
            console.error('Network Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
    
    /**
     * Dynamically creates and displays formatted HTML from JSON data.
     * @param {object} jsonData - The JSON object from GPT.
     */
    function displayFormattedData(jsonData) {
        resultContainer.innerHTML = ''; // Clear previous results

        const date = jsonData.date || 'Неизвестно';
        const totalAmount = jsonData.total_amount || 'Неизвестно';

        // Display summary
        const summaryHtml = `
            <h2>🧾 Результаты анализа</h2>
            <p><strong>Дата:</strong> ${date}</p>
            <p><strong>Общая сумма:</strong> ${totalAmount}</p>
        `;
        resultContainer.innerHTML += summaryHtml;

        // Display items
        if (jsonData.items && jsonData.items.length > 0) {
            const itemsList = document.createElement('ul');
            itemsList.classList.add('items-list');

            jsonData.items.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.classList.add('item-entry');

                // Create a simple object with the desired keys
                const simpleData = {
                    'Покупка': item.name || 'Неизвестно',
                    'Количество': item.quantity || 'Неизвестно',
                    'Цена': item.price || 'Неизвестно',
                    'Категория': item.category || 'Неизвестно'
                };

                // Dynamically create HTML from our simple object
                let itemHtml = '';
                for (const key in simpleData) {
                    itemHtml += `<p><strong>${key}:</strong> ${simpleData[key]}</p>`;
                }
                itemLi.innerHTML = itemHtml;
                itemsList.appendChild(itemLi);
            });

            resultContainer.appendChild(itemsList);
        } else {
            resultContainer.innerHTML += '<p>Список покупок не найден.</p>';
        }
    }
});

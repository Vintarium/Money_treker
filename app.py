import os
import json
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from base64 import b64encode
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)

def process_receipt_with_gpt(image_bytes):
    """
    Processes a receipt image using the GPT-4o-mini API.
    """
    base64_image = b64encode(image_bytes).decode("utf-8")

    # Create an OpenAI client, explicitly specifying our API base URL and key
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://api.proxyapi.ru/openai/v1"
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
    "Ты — эксперт-аналитик по финансовым чекам. Твоя задача — извлечь данные из изображения чека и вернуть их в строго определенном формате JSON. "
    "Ответ должен содержать только JSON-объект и ничего больше — без лишних слов, комментариев или форматирования вроде ```json.\n"

    "Структура JSON должна быть следующей:\n"
    "{\n"
    '  "date": "YYYY-MM-DD",\n'
    '  "total_amount": 1234.56,\n'
    '  "items": [\n'
    '    {\n'
    '      "name": "Название товара",\n'
    '      "quantity": 1.0,\n'
    '      "price": 123.45,\n'
    '      "category": "Продукты"\n'
    '    }\n'
    '  ]\n'
    "}\n\n"

    "Правила извлечения:\n"
    "1. `date`: Найди дату на чеке и приведи её к формату ГГГГ-ММ-ДД. Если год не указан, используй текущий.\n"
    "2. `total_amount`: Извлеки итоговую сумму чека. Это должно быть число с плавающей точкой.\n"
    "3. `items`: Создай массив объектов для каждой позиции в чеке. `name` — это название, `quantity` — количество (число), `price` — цена за единицу (число).\n"
    "4. `category`: Определи категорию для каждого товара. Используй одну из следующих категорий: "
    "**Продукты**, **Бытовая химия**, **Одежда**, **Электроника**, **Развлечения**, **Транспорт**, **Услуги**, **Другое**. "
    "Если не можешь определить категорию, используй 'Другое'."
)
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Распознай этот чек и распиши всё по категориям."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ],
        max_tokens=1000
    )

    return response.choices[0].message.content

@app.route("/")
def index():
    """
    Main page of the application.
    """
    return render_template("index.html")

@app.route("/api/process-receipt", methods=["POST"])
def process_receipt():
    """
    API endpoint for processing a receipt upload.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        image_bytes = file.read()
        gpt_raw_response = process_receipt_with_gpt(image_bytes)
        
        # We will not parse JSON on the backend anymore. We will send the raw string.
        # This is a temporary change for debugging, as per your request.
        return jsonify({"success": True, "data": gpt_raw_response})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

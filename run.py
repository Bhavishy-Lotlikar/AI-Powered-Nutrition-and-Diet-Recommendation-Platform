from app.main import analyze_food

if __name__ == "__main__":
    image_path = "assets/food.jpg"

    result = analyze_food(image_path)

    print("\n===== RESULT =====\n")
    print(result)
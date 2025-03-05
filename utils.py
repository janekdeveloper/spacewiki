import json
import sqlite3
from hugchat import hugchat

def ask_ai(user_message):
    if user_message == '':
        return 'Error'
    user_input = user_message.lower()
    chatbot = hugchat.ChatBot(cookie_path='cookies.json')
    id = chatbot.new_conversation(assistant='67c31bcd7463d6262f2a1968')
    chatbot.change_conversation(id)
    response = str(chatbot.chat(user_input))
    print(f'| INFO | {response}')
    return response

def get_planets():
    conn = sqlite3.connect("planets.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM planets ORDER BY id")
    planets_data = cursor.fetchall()
    
    planets = {}
    for row in planets_data:
        planet_id, name, diameter, mass, avg_distance, year_length, min_temp, max_temp, avg_temp = row
        
        cursor.execute("SELECT gas, percentage FROM atmosphere WHERE planet_id = ?", (planet_id,))
        atmosphere_data = {gas: percentage for gas, percentage in cursor.fetchall()}

        cursor.execute("SELECT name, description FROM missions WHERE planet_id = ?", (planet_id,))
        missions = [{"name": mission_name, "description": desc} for mission_name, desc in cursor.fetchall()]
        
        planets[name] = {
            "name": name,
            "characteristics": {
                "diameter": diameter,
                "mass": mass,
                "average_distance_from_sun": avg_distance,
                "year_length": year_length,
                "surface_temperature": {
                    "min": min_temp,
                    "max": max_temp,
                    "average": avg_temp
                },
                "atmosphere": atmosphere_data
            },
            "current_missions": missions
        }
    
    conn.close()
    return planets
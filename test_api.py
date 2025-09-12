"""
Script de teste simples para verificar se a API está funcionando
Execute este script com o servidor rodando em localhost:8000
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Testa o endpoint de health check"""
    print("🩺 Testando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_create_table():
    """Testa a criação de uma mesa"""
    print("\n📋 Testando criação de mesa...")
    try:
        data = {"name": "Mesa de Teste"}
        response = requests.post(f"{BASE_URL}/tables", json=data)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return response.status_code == 201, result.get("id")
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False, None

def test_get_table(table_id):
    """Testa a busca de uma mesa por ID"""
    print(f"\n🔍 Testando busca da mesa {table_id}...")
    try:
        response = requests.get(f"{BASE_URL}/tables/{table_id}")
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_list_tables():
    """Testa a listagem de todas as mesas"""
    print("\n📝 Testando listagem de mesas...")
    try:
        response = requests.get(f"{BASE_URL}/tables")
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    """Executa todos os testes"""
    print("🧪 Iniciando testes da API VTT Tables...")
    print("=" * 50)
    
    # Teste 1: Health check
    if not test_health():
        print("❌ Health check falhou!")
        return
    print("✅ Health check passou!")
    
    # Teste 2: Criar mesa
    success, table_id = test_create_table()
    if not success:
        print("❌ Criação de mesa falhou!")
        return
    print("✅ Criação de mesa passou!")
    
    # Teste 3: Buscar mesa
    if table_id and not test_get_table(table_id):
        print("❌ Busca de mesa falhou!")
        return
    print("✅ Busca de mesa passou!")
    
    # Teste 4: Listar mesas
    if not test_list_tables():
        print("❌ Listagem de mesas falhou!")
        return
    print("✅ Listagem de mesas passou!")
    
    print("\n🎉 Todos os testes passaram!")
    print("🚀 API está funcionando corretamente!")

if __name__ == "__main__":
    main()
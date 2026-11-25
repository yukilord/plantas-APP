# Herbanário

Aplicação web para acompanhar uma coleção de plantas, regas e cuidados.

Inclui fichas de cultivo detalhadas, lembretes pessoais de texto livre, um
diagnóstico orientativo por sintomas baseado em regras simples e um cartão de
cuidados para guardar como imagem ou partilhar.

## Abrir o site

No Windows, abre uma janela do PowerShell na pasta do projeto e executa:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

O site abre automaticamente em <http://localhost:8000/>. Para o fechar, prime
`Ctrl+C` na janela do PowerShell.

## Firebase

A aplicação usa Firebase Authentication (email/palavra-passe, Google e GitHub),
Cloud Firestore para sincronizar perfis, plantas e lembretes, e Cloud Storage
para sincronizar fotografias carregadas pelo utilizador. O `firebaseConfig` da
aplicação Web está em `js/firebase-config.js`; não é necessária instalação de
npm nem da CLI para executar a aplicação localmente.

Antes de registar uma conta:

1. Na consola Firebase, ativa **Authentication → Sign-in method → Email/Password**,
   **Google** e **GitHub**. No fornecedor Google, confirma o email de suporte.
   Para o GitHub:
   - Cria uma OAuth App em **GitHub → Settings → Developer settings → OAuth Apps**.
   - Define a Homepage URL para `http://localhost:8000` (e o domínio publicado, se aplicável).
   - Define o callback como
     `https://appflor-cb81f.firebaseapp.com/__/auth/handler`.
   - Copia o Client ID e Client Secret para o fornecedor GitHub na consola Firebase
     e guarda. Mantém o Client Secret apenas na consola, nunca no código.
2. Cria a base de dados em **Firestore Database → Regras**, cola o conteúdo de
   `firestore.rules` e publica-o.
3. Ativa **Storage → Regras**, cola o conteúdo de `storage.rules` e publica-o.
   O Storage pode exigir a ativação do plano de faturação do projeto.
4. Em **Authentication → Settings → Authorized domains**, confirma que
   `localhost` está autorizado para o servidor local. Para publicar o site,
   adiciona também o domínio de alojamento. O login Google redireciona
   temporariamente para a autenticação e regressa à aplicação.
5. Inicia o servidor indicado acima e escolhe **Registar**, **Continuar com
   Google** ou **Continuar com GitHub**. Usa a mesma conta para aceder aos teus
   dados noutros dispositivos.

Em alternativa, depois de criar as bases de dados e iniciar sessão na Firebase
CLI com `firebase login`, podes publicar as regras a partir da pasta do projeto
com `firebase deploy --only firestore:rules,storage`. A CLI precisa de Node.js e
npm; não é necessária para o uso normal da aplicação.

As alterações são guardadas localmente e enviadas para Firebase quando há
ligação à internet; ao abrir a aplicação, os dados da conta são carregados da
nuvem. As fotografias carregadas são enviadas para o Storage; a
configuração da Firebase Web é pública e as regras restringem o acesso aos
dados e ficheiros ao respetivo utilizador autenticado. Se já tinhas dados locais,
regista uma conta Firebase com o mesmo email para os importar para essa conta.

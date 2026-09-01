# 🎼 Solfy — Gerador Inteligente de Exercícios de Partitura

**Solfy** é uma aplicação web criada para gerar exercícios de leitura musical de forma **aleatória, personalizada e musicalmente coerente**.

A proposta não é simplesmente sortear notas. O Solfy utiliza conceitos de **harmonia, melodia, ritmo, tonalidade e dificuldade** para produzir exercícios que tenham sentido musical e possam ser utilizados no estudo de leitura de partituras.

---

## 🎯 Objetivo

O Solfy foi desenvolvido para facilitar a criação de exercícios personalizados de leitura musical.

O usuário pode definir exatamente quais elementos deseja estudar e gerar uma partitura adequada ao seu nível.

A ideia é transformar:

> **"Quero praticar leitura musical"**

em:

> **"Quero praticar leitura em Mi maior, clave de Sol, usando colcheias e semicolcheias, nas oitavas 3 e 4, em 4/4, com dificuldade avançada."**

E gerar automaticamente um exercício musical baseado nessas configurações.

---

## ✨ Principais recursos

### 🎼 Geração de partituras

* Geração automática de exercícios.
* Melodias com lógica musical.
* Progressões harmônicas geradas dinamicamente.
* Relação entre harmonia e melodia.
* Sensação de tensão e repouso.
* Movimentos melódicos coerentes.
* Diferentes níveis de dificuldade.

### 🎵 Personalização

Permite selecionar:

* Notas disponíveis: Dó, Ré, Mi, Fá, Sol, Lá e Si.
* Oitavas específicas.
* Figuras rítmicas.
* Pausas.
* Tonalidades.
* Armaduras de clave.
* Claves.
* Fórmula de compasso.
* BPM.
* Quantidade de compassos.
* Nível de dificuldade.

### 🎹 Reprodução

O exercício pode ser reproduzido diretamente no navegador utilizando:

* Piano;
* Metrônomo;
* Contagem inicial;
* Controle de BPM;
* Controle independente do volume do piano;
* Controle independente do volume do metrônomo;
* Reprodução novamente após parar.

O metrônomo acompanha a estrutura métrica do exercício e marca os tempos de cada compasso.

---

## 🎧 Timeline

Durante a reprodução, o Solfy acompanha o exercício através de uma timeline sincronizada com os eventos musicais.

A nota que está sendo executada pode ser destacada visualmente, permitindo relacionar:

**partitura → audição → leitura**

A timeline utiliza os eventos musicais reais do exercício, evitando interpretar elementos visuais da partitura, como claves ou armaduras, como notas.

---

## 🧠 Inteligência musical

Um dos principais objetivos do Solfy é evitar exercícios completamente aleatórios e musicalmente desconexos.

O gerador considera conceitos como:

* Funções harmônicas;
* Progressões de acordes;
* Tônica;
* Dominante;
* Subdominante;
* Tensão;
* Repouso;
* Notas estruturais;
* Notas de passagem;
* Movimento conjunto;
* Saltos melódicos;
* Motivos;
* Frases;
* Estrutura rítmica;
* Relação entre melodia e harmonia.

Assim, mesmo quando o exercício é gerado aleatoriamente, existe uma estrutura musical por trás dele.

### Exemplo conceitual

Uma progressão pode ser construída a partir de relações como:

```text
I → V → vi → IV
```

A melodia é então construída considerando as notas dos acordes e os momentos de tensão e resolução.

O objetivo é fazer com que o exercício pareça uma pequena peça musical, e não apenas uma sequência aleatória de notas.

---

## 📊 Níveis de dificuldade

O Solfy possui diferentes níveis de dificuldade para adaptar os exercícios ao estudante.

### 🟢 Fácil

Prioriza:

* Ritmos simples;
* Movimentos melódicos mais previsíveis;
* Menor quantidade de saltos;
* Sem síncopes complexas;
* Sem contratempos avançados.

### 🟡 Intermediário

Pode incluir:

* Maior variedade rítmica;
* Colcheias;
* Semicolcheias;
* Saltos moderados;
* Maior variedade melódica;
* Frases mais elaboradas.

### 🔴 Avançado

Pode incluir:

* Ritmos complexos;
* Síncopes;
* Contratempos;
* Subdivisões;
* Saltos maiores;
* Padrões melódicos mais complexos;
* Maior independência rítmica.

---

## 🎼 Notação musical

A renderização da partitura utiliza o **OpenSheetMusicDisplay (OSMD)**.

O sistema busca representar a notação musical de forma tradicional, incluindo:

* Clave de Sol;
* Clave de Fá;
* Armaduras;
* Fórmulas de compasso;
* Barras de compasso;
* Notas;
* Pausas;
* Acidentes;
* Diferentes figuras rítmicas;
* Sistemas de partitura;
* Agrupamento de colcheias;
* Agrupamento de semicolcheias.

As figuras rítmicas consecutivas são agrupadas de acordo com a divisão métrica, respeitando a lógica tradicional da escrita musical.

---

## 🎹 Claves e oitavas

O Solfy permite trabalhar diferentes regiões do instrumento.

### Clave de Sol

O usuário pode selecionar:

```text
Oitava 3
Oitava 4
Oitava 5
Oitava 6
```

### Clave de Fá

O usuário pode selecionar:

```text
Oitava 1
Oitava 2
Oitava 3
```

As oitavas são configuráveis antes da geração do exercício.

---

## 🎵 Tonalidades

O sistema oferece as 12 tonalidades maiores:

```text
C
G
D
A
E
B
F#
C#
F
Bb
Eb
Ab
```

A armadura correspondente é representada na partitura.

---

## 📱 Interface responsiva

O Solfy foi desenvolvido para funcionar em:

* 💻 Computadores;
* 📱 Smartphones;
* 📲 Tablets.

A interface utiliza uma abordagem limpa e minimalista, com tons suaves de azul e uma barra lateral de configurações que pode ser aberta ou fechada.

Em telas menores, a partitura prioriza o fluxo vertical para evitar que exercícios longos exijam rolagem horizontal.

---

## ✨ Animações

A interface utiliza animações suaves e discretas para evitar mudanças bruscas.

Por exemplo:

* Abertura e fechamento do menu;
* Geração da partitura;
* Transições;
* Modal de exportação;
* Alterações de estado;
* Destaque da reprodução.

A intenção é manter a interface fluida sem exagerar nos efeitos.

---

## 📄 Exportação

Os exercícios podem ser exportados para diferentes formatos.

### PDF

Permite gerar uma versão adequada para:

* Estudo;
* Impressão;
* Arquivamento.

Partituras longas podem ocupar várias páginas.

### JPEG

Permite exportar a partitura como imagem.

O usuário pode escolher diferentes predefinições de resolução.

Quando uma partitura for grande demais para uma única imagem, o sistema pode dividi-la automaticamente em partes consecutivas, sem cortar compassos.

### 🎵 MP3

A execução do exercício também pode ser exportada como áudio.

---

## 🏷️ Personalização da exportação

Antes de exportar, o usuário pode definir:

* Nome do exercício;
* Título da partitura;
* Formato;
* Qualidade/resolução.

O título escolhido aparece na partitura exportada.

As exportações também possuem a identificação:

> **Solfy - gerador de exercícios de partitura**

---

## 🏗️ Arquitetura

O projeto busca separar o modelo musical das diferentes formas de utilização do exercício.

Conceitualmente:

```text
                    SOLFY
                      │
                      ▼
             CONFIGURAÇÕES
                      │
                      ▼
             GERADOR MUSICAL
                      │
                      ▼
             EXERCÍCIO MUSICAL
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     OSMD            ÁUDIO         TIMELINE
       │              │              │
       ▼              ▼              ▼
   PARTITURA        PIANO        SINCRONIZAÇÃO
       │              │
       └──────────────┼──────────────┐
                      ▼              ▼
                     PDF            JPEG
```

O exercício musical funciona como uma **fonte única de dados**, permitindo que a partitura, o áudio, a timeline e as exportações representem o mesmo exercício.

---

## 🛠️ Tecnologias

O Solfy é desenvolvido como uma aplicação web utilizando tecnologias como:

* **HTML5**
* **CSS3**
* **JavaScript**
* **OpenSheetMusicDisplay (OSMD)**
* **Web Audio API**
* **SVG**
* Tecnologias auxiliares para exportação de arquivos

O projeto foi pensado para funcionar diretamente no navegador, sem exigir uma instalação complexa.

---

## 🚀 Como executar

Clone o repositório:

```bash
git clone https://github.com/SEU-USUARIO/solfy.git
```

Entre na pasta:

```bash
cd solfy
```

Como o projeto utiliza tecnologias web, pode ser executado através de um servidor local.

Por exemplo, utilizando o **Live Server** no VS Code.

Depois, abra o endereço local fornecido pelo servidor no navegador.

---

## 📁 Estrutura básica

A estrutura pode ser organizada da seguinte maneira:

```text
solfy/
│
├── index.html
├── style.css
├── script.js
│
├── assets/
│   └── ...
│
└── README.md
```

---

## 🔮 Possíveis evoluções

O Solfy possui espaço para futuras melhorias, como:

* Mais níveis de dificuldade;
* Mais fórmulas de compasso;
* Compassos compostos;
* Exercícios polifônicos;
* Exercícios específicos para piano;
* Exercícios para duas mãos;
* Ditado musical;
* Treinamento de percepção;
* Estatísticas de desempenho;
* Histórico de exercícios;
* Sistema de progresso;
* Biblioteca de exercícios;
* Mais instrumentos para reprodução;
* Personalização avançada de timbres;
* Exercícios focados em intervalos;
* Exercícios focados em escalas;
* Exercícios focados em leitura à primeira vista.

---

## 🎯 Filosofia do projeto

O Solfy parte de uma ideia simples:

> **Um exercício de leitura musical não precisa ser apenas aleatório para ser imprevisível. Ele pode ser imprevisível e, ao mesmo tempo, musical.**

A proposta é unir **tecnologia, teoria musical e prática instrumental** para criar uma ferramenta que ajude estudantes e músicos a desenvolverem sua leitura de maneira progressiva e personalizada.

---

## 📌 Status

🚧 **Em desenvolvimento**

O projeto está em constante evolução, principalmente nas áreas de:

* Geração musical;
* Notação;
* Reprodução de áudio;
* Responsividade;
* Exportação;
* Experiência do usuário.

---

## 📜 Licença

Defina aqui a licença desejada para o projeto.

Exemplo:

```text
MIT License
```

---

## 🎼 Solfy

**Solfy — Gerador de Exercícios de Partitura**

> Gere. Leia. Ouça. Evolua.

# PRISM

## Predictive Resilience & Infrastructure Simulation Model

> **See how your infrastructure behaves before production does.**

PRISM is an infrastructure simulation platform that helps engineers
understand how an architecture may behave before making production
changes.

Instead of experimenting directly on production infrastructure,
PRISM provides a transparent simulation environment where engineers
can model scenarios such as traffic spikes, infrastructure failures,
capacity constraints, and cost changes.

---

## Why PRISM?

Infrastructure decisions are often made with incomplete information.

A change that looks safe in a normal environment can behave very
differently when traffic increases or a critical dependency fails.

PRISM helps engineers answer questions such as:

- What happens if traffic increases by 10×?
- Which services are affected if a database fails?
- How much additional capacity is required?
- What is the modeled cost impact?
- Why did the simulation reach this conclusion?
- What assumptions were used to calculate the result?

---

## Core Features

### 🔬 Deterministic Simulation

PRISM uses a deterministic simulation engine to calculate
capacity, dependencies, failures, and modeled infrastructure impact.

### 🌐 Interactive Architecture Graph

Visualize infrastructure as an interactive dependency graph.

### 💥 Blast Radius

Hover over a component to visualize dependent services that may
be affected by its failure.

### 🧮 Show the Math

Every important numerical result can be inspected through the
underlying calculation and assumptions.

### ⚙️ Editable Assumptions

Simulation assumptions such as modeled throughput and cost can
be changed and the simulation can be rerun.

### 🤖 AI-Powered Explanation

Amazon Bedrock is used to explain deterministic simulation results
and communicate the architectural trade-offs in natural language.

### 📄 Decision Record Export

Export simulation findings and decisions as a Markdown engineering
decision record.

### 🔮 Future-State Architecture

Visualize the proposed architecture after applying a simulation
recommendation.

---

## Simulation Scenarios

PRISM currently focuses on:

| Scenario | Description |
|---|---|
| Traffic Spike | Simulate increased application traffic |
| Infrastructure Failure | Simulate failure of critical components |
| Capacity Constraint | Identify infrastructure capacity bottlenecks |
| Cost Change | Analyze modeled cost changes |

---

## Architecture

```text
                    USERS
                      │
                      ▼
                 CloudFront
                      │
                      ▼
                     ALB
                   ╱     ╲
                  ▼       ▼
               EC2-A    EC2-B
                  ╲       ╱
                   ▼     ▼
                     RDS

Technology Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Flow
* Lucide React

Backend

* Python
* AWS Lambda
* API Gateway

AWS

* Amazon API Gateway
* AWS Lambda
* Amazon DynamoDB
* Amazon S3
* Amazon Bedrock

Infrastructure

* AWS SAM

⸻

How PRISM Works

Architecture Model
        │
        ▼
Scenario Selection
        │
        ▼
Deterministic Simulation
        │
        ▼
Impact Analysis
        │
        ├──► Blast Radius
        │
        ├──► Show the Math
        │
        └──► Cost / Capacity Analysis
                    │
                    ▼
             Recommendation
                    │
                    ▼
           Future Architecture
                    │
                    ▼
             Bedrock Explanation
                    │
                    ▼
          Decision Record Export

Important Design Principle

AI should explain infrastructure behavior, not invent the
infrastructure behavior.

The numerical simulation is deterministic and based on explicit
simulation assumptions.

Amazon Bedrock receives structured simulation results and explains
the findings, trade-offs, and recommendations.

⸻

Simulation Assumptions

PRISM uses explicitly defined modeled assumptions.

For example:EC2 throughput: 150 req/s per node
EC2 modeled cost: $100/month
RDS modeled cost: $200/month

These values are simulation assumptions and are not presented as
official AWS capacity or pricing guarantees.

⸻

Project Structure

PRISM/
│
├── frontend/
│   └── Next.js application
│
├── backend/
│   ├── simulator/
│   ├── functions/
│   └── bedrock/
│
├── infrastructure/
│   └── AWS infrastructure definitions
│
├── sample-data/
│   └── Example architecture models
│
├── docs/
│   └── Technical documentation
│
├── README.md
├── .gitignore
└── LICENSE


Local Development

Clone
git clone https://github.com/Ritik-pixel28/PRISM.git
cd PRISM

Frontend
cd frontend
npm install
npm run dev

Open:
http://localhost:3000

Project Status

🚧 PRISM is currently under active development as part of the
WeMakeDevs × AWS First Commit Hackathon 2026.

⸻

Disclaimer

PRISM is a simulation and architectural decision-support tool.

It does not reproduce AWS’s internal infrastructure behavior and
does not make changes to production AWS environments.

Simulation results depend on the assumptions provided by the user.

⸻

License

License information will be added as the project is finalized.

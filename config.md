# Configuração Inicial

## CMD

- mkdir caragua360
- cd caragua360
- git clone https://github.com/manuoleoin/caragua360-backend.git backend
- git clone https://github.com/manuoleoin/caragua360-frontend.git frontend
- code .

## VSCode Terminal #1

- cd backend 
- npm install
- npx prisma generate
- npx prisma db push --force-reset
- npx prisma db seed
- npm run start:dev

## VSCode Terminal #2

- cd frontend
- npm install
- npm run dev


## VSCode Terminal #3

- cd backend
- npx prisma studio
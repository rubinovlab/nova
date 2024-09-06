# NOVA: Neuro Omics Visual Analystics

### Installation

In terminal: npm install 
to install all required packages

### Run application

In terminal: npm run dev
to run the application on localhost

### Structure

Under the app folder, the main analysis page is contained in the compare folder. States keep track of all the information that is passed through graph components in the components folder.

Graphs are created with D3.js, where the data and graph has to be updated when data changes in the useEffect dependency array.

### Data processing

Data is uploaded into a PostgreSQL database for now, but in the future the user should be able to directly upload data without a database.

Scripts are found in the scripts folder. To run scripts, in terminal: ts-node scripts/fileName.ts
A local python environment may be needed to run the python script, which is ran in parse-grex.ts

Data structures are defined with prisma. See schema.prisma under the prisma folder for more details about how data is structured in the database.


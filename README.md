# NOVA: Neuro Omics Visual Analystics

### Installation

In terminal: npm install 
to install all required packages

Make sure prisma schema is generated by running: npx prisma generate

### Run application

In terminal: npm run dev
to run the application on localhost

### Structure

Under the app folder, the main analysis page is contained in the compare folder. States keep track of all the information that is passed through graph components in the components folder.

Graphs are created with D3.js, where the data and graph has to be updated when data changes in the useEffect dependency array.

### Data processing

Current gene position data is in the database. You can upload your own data with the scripts in the scripts folder.


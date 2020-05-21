import React, { useEffect, useState } from 'react';
import './App.css';

import { v4 as uuid } from 'uuid';

import { Container,Button, Paper, Grid,TextField, Box, Checkbox } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

import OkdbClient from "okdb-client";
import cloneDeep from 'lodash/cloneDeep';

// location of your server
const HOST = "localhost:7899";
// token for user authentication, handled by the auth handler on the server side
const TOKEN = "12345";
const okdb = new OkdbClient(HOST);

// data type, typically corresponds to the table name
const DATA_TYPE="todo-tasks"; 
// id of the object to be edited collaboratively
const DOCUMENT_ID = "my-document-id"; 

function App() {
  const [doc, setDoc] = useState(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskError, setNewTaskError] = useState(null);
  
  useEffect(() => {
    // 1. step - connect
    okdb.connect(TOKEN)
      .then(user => {
        console.log("[okdb] connected as ", user);
        // 2. step - open document for collaborative editing
        const defaultValue = { tasks: [] };
        okdb.open(
            DATA_TYPE, // collection name
            DOCUMENT_ID,
            defaultValue, // default value to save if doesn't exist yet
            (data, meta) => { // callback to receive doc changes from others
              console.log("Live: ", data, JSON.stringify(meta));          
              setDoc(cloneDeep(data));  
            }, 
            (id, presence) => { // callback to recieve status changes for other collaborators
              console.log("Presence: id=", id, " payload=" + JSON.stringify(presence));
            }
          )
          .then(data => { 
            // get the data once the doc is opened
            console.log("Loaded doc from server ", data)
            setDoc(data);
          })
          .catch(err => { console.log("Error opening doc ", err)});
      })
      .catch(err => {
        console.error("[okdb] error connecting ", err);
      });
  }, []);

  const onNewTaskChange = (e) => {
    setNewTaskText(e.target.value);
    if(e.target.value) {
      setNewTaskError(null);
    }
  }

  const updateDoc = (newDoc) => {
    okdb.put(DATA_TYPE, DOCUMENT_ID, newDoc)
    .then(res => {
      console.log("doc saved, ", res);
      setDoc(cloneDeep(res));
      setNewTaskText("");
    })
    .catch((err) =>  console.log("Error updating doc", err));
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    onAdd();
  }

  const onAdd = () => {
    if(!newTaskText) {
      setNewTaskError("Text is required");
      return;
    };
    if(!doc) {
      setNewTaskError("Connecting to db, please try again later");
      return;
    }
    const newDoc = cloneDeep(doc);
    newDoc.tasks.push({
      id: uuid(),
      text: newTaskText,
      done: false,
      date: new Date().getTime()
    });
    updateDoc(newDoc);
  };

  const onTaskChange = (e) => {
    console.log("Task change ", e.target);
    const newDoc = cloneDeep(doc);
    const task = newDoc.tasks.find(task => task.id === e.target.id);
    task.done = e.target.checked;
    updateDoc(newDoc);
  };

  return (
    <Container maxWidth="xs" className="container">
      <Grid container spacing={3}>        
        <Grid item xs={12}>
          <h1>TODO</h1>
          <p key="p1">Open this page twice, for example on your computer and on the phone.</p>
          <p key="p2">Add tasks in one window and see the immediate changes in another one.</p>
  
          { doc && doc.tasks &&
            <Paper >
              {doc.tasks.map(task => {
                return <Box key={task.id} p={2} className="task-row">
                    <Grid container 
                      spacing={2}
                      alignItems="center"
                      justify="center">
                      <Grid item xs={10} className={ task.done ? 'task-done' : ''}>
                        {task.text}
                      </Grid>
                      <Grid item xs={2}>
                        <Checkbox
                          id={task.id}
                          checked={task.done}
                          onChange={onTaskChange}
                          color="primary"                          
                        />
                      </Grid>
                    </Grid>
                  </Box>
              })}
            </Paper>
          }
          
          <form onSubmit={onFormSubmit}>
            <Box mt={2}>
              <TextField                   
                  margin="dense"
                  label="Task text"
                  variant="outlined"
                  value={newTaskText}
                  onChange={onNewTaskChange} 
                  error={!!newTaskError}
                  helperText={newTaskError}/>
            </Box>            
            <Box mt={1}>
              <Button variant="contained" color="primary" onClick={onAdd}>
                <AddIcon className="button-icon"/> &nbsp;&nbsp;Create
              </Button>
            </Box>            
          </form>          
        </Grid>        
      </Grid>
      
    </Container>
  );
}

export default App;

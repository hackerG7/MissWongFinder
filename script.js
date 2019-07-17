let CurrentID = 11000;//start file ID
let MaxID = 12000;//end file ID
let LoopDelay = 50;
let faceMatcher;
let win = window.open("MissWong.html");
let saveMissWong = true;//save miss wong to the database.


Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')

]).then(start)

async function start() {
  
  
  const labeledFaceDescriptors = await loadLabeledImages()
  
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  document.body.append('Loaded')
  console.log("Train finished");  
  loop();
  
}
function download(url){
  var a = $("<a>")
    .attr("href",url)
    .attr("download", "img.png")
    .appendTo("body");

a[0].click();

a.remove();
}
async function loop(){

  var url = "https://cors-anywhere.herokuapp.com/http://stlouis.edu.hk/upload_files/album/"+CurrentID+".jpg";
  detect(faceMatcher, url,CurrentID)
  if(CurrentID < MaxID){
    CurrentID++;
    setTimeout(loop,LoopDelay)
  }
}
async function getImage(url){
  var image = await faceapi.fetchImage(url);
  return image;
}
function appendImage(image, id){
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  container.append(image)
  canvas = faceapi.createCanvasFromMedia(image)
  container.append(canvas)
  var text = document.createElement("p");
  text.innerHTML = id;
  container.append(text);
  return [canvas, container];
}
async function detect(faceMatcher, imageURL, id){
  
    var image = await getImage(imageURL)
    var r = appendImage(image,id);
    var canvas = r[0];
    var container = r[1];
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors().withAgeAndGender()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    var foundMissWong = false;
    var missWongID = -1;
    results.forEach((result, i)  => {
      if(result._label=="MissWong" && detections[i].gender=="female"){
        foundMissWong = true;
        missWongID = i;
      }
      //draw result.
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() +"  "+detections[i].gender })
      drawBox.draw(canvas)
    });
    console.log(foundMissWong);
    
    if(foundMissWong){
      if(saveMissWong){
        var con = win.document.createElement('div')
        con.style.position = 'relative'
        win.document.body.append(con)
        con.append(image);
      }
      console.log("found misswong: "+id);
    }
    setTimeout(function(container, canvas){
      container.removeChild(canvas);
      document.body.removeChild(container);
    },1000,container, canvas)
    /*results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString()+"  "+detections[i].gender })
      drawBox.draw(canvas)
    })*/
}
function loadLabeledImages() {
  const labels = ['dicks','CMY','MissWong','Jessy','MissTang','t2','t3','t4','t5','CWW']
  return Promise.all(
    labels.map(async label => {
      var descriptions = []
      if(label=='dicks'){
        //train all dicks
        var amount = 1;
        for (let i = 1; i <= amount; i++) {
          var img = await faceapi.fetchImage(`./dicks/ (${i}).jpg`)
          var detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors()
          if(detections!=undefined){
            for(let j = 0 ; j < detections.length ; j++){
              descriptions.push(detections[j].descriptor)
              console.log("training dick: ["+i+"]  ["+j+"]");
            }
          }
        }
      }else {
        var amount = 1;
        switch(label){
          default:
            amount = 1;
          break;
          case "MissWong":
            amount = 17;
          break;
          case "Jessy":
            amount = 2;
          break;
          case "CMY":
            amount = 5;
          break;
          case "MissTang":
            amount = 2;
          break;
          case "principle":
            amount = 2;
          break;
          case "t1":
            amount = 0;
          break;
        }
        for (let i = 1; i <= amount; i++) {
          var img = await faceapi.fetchImage(`./labeled_images/${label}/ (${i}).jpg`)
          var detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
          if(detections!=undefined){
            descriptions.push(detections.descriptor)
            console.log("training "+label+i);
          }
        }
        //train miss wong
        
      }
      

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}


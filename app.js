const supabaseUrl = "https://blkxlczwjkjgdfixbide.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsa3hsY3p3amtqZ2RmaXhiaWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzA3NDcsImV4cCI6MjA2ODQwNjc0N30.z6vZxMuPTvTn7ShSexmSo9C5gGJpl4AvJCSBknIDOZc";

const client = supabase.createClient(supabaseUrl, supabaseKey);

// ======================================= DOM Elements ======================================================================
const signupform = document.getElementById("signupForm");
const loginform = document.getElementById("loginForm");

const username = document.getElementById("username");
const useremail = document.getElementById("email");
const userpassword = document.getElementById("password");

const loginemail = document.getElementById("loginemail");
const loginpassword = document.getElementById("loginpassword");
const signupAcc = document.getElementById("signbtn");

const toggleSignup = document.querySelector(".toggleSignup");
const toggleLogin = document.querySelector(".toggleLogin");
const logoutBtn = document.getElementById("logoutBtn");

const createPostBtn = document.getElementById("createPostBtn");
let userName = document.getElementById("userName");
let image = document.getElementById("image");

const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
let postShow = document.getElementById("postsContainer");
// ======================================= Sign Up Handler ====================================================================
if (signupform) {
  signupform.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!username.value || !useremail.value || !userpassword.value) {
      Swal.fire("Oops!", "Please fill in all fields", "warning");
      return;
    }
    console.log(username.value, useremail.value, userpassword.value);

    showLoader(); //  Show loader

    const { data, error } = await client.auth.signUp({
      email: useremail.value,
      password: userpassword.value,
    });

    if (error) {
      hideLoader();
      Swal.fire("Error", error.message, "error");
      return;
    }
    const { error: insertError } = await client.from("Instagram").insert({
      id: data.user.id,
      user_name: username.value,
      email: useremail.value,
    });

    if (insertError) {
      Swal.fire("Error", insertError.message, "error");
      return;
    }

    Swal.fire(
      "Success! Signed up ",
      "You have signed up successfully! Please check your Email"
    );

    username.value = "";
    useremail.value = "";
    userpassword.value = "";
    // After everything
    hideLoader(); //  Hide loader
  });
}
// ======================================= Login Handler ======================================================================
if (loginform) {
  loginform.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoader();

    const { data, error } = await client.auth.signInWithPassword({
      email: loginemail.value,
      password: loginpassword.value,
    });

    hideLoader();
    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    Swal.fire("Login", "Login successful!", "success");
    window.location.href = "dashboard.html";
  });
}
// ======================================= loader Handle  =====================================================================

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// ======================================= Logout Handler =====================================================================

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    showLoader();

    const { error } = await client.auth.signOut();

    hideLoader();
    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      Swal.fire("Logged Out", "You have been logged out!", "success");
      window.location.href = "index.html";
    }
  });
}

if (createPostBtn) {
  createPostBtn.addEventListener("click", function () {
    postForm.classList.toggle("hidden");
  });

  submitPostBtn.addEventListener("click", async function () {
    // Get current user from Supabase Auth
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      Swal.fire("Error", "❌ User not found or not logged in", "error");
      return;
    }

    let file = image.files[0];
    if (!file) {
      Swal.fire("Please select an image file.");
      return;
    }

    let filePath = `public/${file.name}`;

    // Upload to Supabase Storage
    const { data: uploadedFile, error: uploadError } = await client.storage
      .from("postapp")
      .upload(filePath, file);

    if (uploadError) {
      Swal.fire("Error uploading file", uploadError.message, "error");
      return;
    }

    // Get public URL of the uploaded image
    const { data: publicUrlData } = client.storage
      .from("postapp")
      .getPublicUrl(filePath);

    let fileUrl = publicUrlData.publicUrl;

    // Insert post into Supabase DB
    const { error: insertError } = await client.from("post_app").insert({
      email: user.email,
      file: fileUrl,
      post_title: postTitle.value,
      post_content: postContent.value,
    });

    if (insertError) {
      Swal.fire("Error saving post", insertError.message, "error");
      return;
    }

    Swal.fire("✅ Post created successfully!");

    // Clear form and hide
    postTitle.value = "";
    postContent.value = "";
    image.value = "";
    postForm.classList.add("hidden");

    // Refresh post feed
    show();
  });
}

// Show all posts
async function show() {
  const { data, error } = await client.from("post_app").select("*").eq("email", user.email);

  if (error) {
    Swal.fire("Error", error.message, "error");
    return;
  }

  postShow.innerHTML = ""; // Clear old posts

  data.forEach((element) => {
    postShow.innerHTML += `
      <div class="post-card">
        <img src="${element.file}" alt="Post Image">
        <h3>${element.post_title}</h3>
        <p>${element.post_content}</p>
        <span>Posted by: ${element.email}</span>
      </div>`;
  });
}
show();
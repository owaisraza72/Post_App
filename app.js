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
const userLogo = document.getElementById("fileLogo");

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
let postFeed = document.getElementById("post-feed");

let editLogo = document.getElementById("editLogo");
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
    else {
      Swal.fire(
        "Success! Signed up ",
        "You have signed up successfully! Please check your Email"
      );

      username.value = "";
      useremail.value = "";
      userpassword.value = "";

      loginPage()
    }
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

function loginPage() {
  window.location.href = "index.html"
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

async function checkAuth() {
  const {
    data: { session },
  } = await client.auth.getSession();
  const currentPage = window.location.pathname.split("/").pop();

  if (!session && currentPage === "dashboard.html") {
    window.location.href = "index.html";
  }
}

const currentPage = window.location.pathname.split("/").pop();
if (currentPage === "dashboard.html" || currentPage === "index.html") {
  checkAuth();
}

async function userProfile() {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    console.error("Error getting session:", error.message);
    return;
  }

  // console.log("User email:", session.user.email);

  // Get user details from Instagram table
  const { data: userData, error: userError } = await client
    .from("Instagram")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError.message);
    return;
  }

  // console.log("User data:", userData);

  // Update navigation bar
  userName.textContent = userData.user_name;

  // Update profile section
  document.getElementById("profileName").textContent = userData.user_name;

  // Get user's post count
  const { count: postCount, error: postError } = await client
    .from("post_app")
    .select("*", { count: "exact" })
    .eq("email", session.user.email);

  if (!postError) {
    document.getElementById("postCount").textContent = postCount;
  }

  // You can add avatar/image update logic here when you implement profile pictures
}

// Call the function when page loads
document.addEventListener("DOMContentLoaded", userProfile);

// ========================================== Supabase editLogo =============================================

if (editLogo) {
  editLogo.addEventListener("click", async () => {
    // alert("ok")
    // file input create karke click hwa
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.click();

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;

      // current logged in user ka session lya h
      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();
      if (sessionError || !session) {
        Swal.fire("Error", "Please login first", "error");
        return;
      }

      const fileName = `profileLogo/${session.user.id}-${Date.now()}-${file.name
        }`;

      const { error: uploadError } = await client.storage
        .from("postapp")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        Swal.fire("Error", "Upload failed", "error");
        return;
      }

      // public URL
      const { data: publicData } = client.storage
        .from("postapp")
        .getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;

      const { error: updateError } = await client
        .from("Instagram")
        .update({ logo_file: publicUrl })
        .eq("id", session.user.id);

      if (updateError) {
        Swal.fire("Error", "Database update failed", "error");
        return;
      }
      Swal.fire("Success!", "Profile logo updated!", "success");
    };
  });
}

async function fetchLogo() {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    console.error("Error getting session:", error.message);
    return;
  }
  // Get user details from Instagram table
  const { data: userData, error: userError } = await client
    .from("Instagram")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError.message);
    return;
  }

  let logo = userData.logo_file;
  // let defaultLogo = document.getElementById("defaultLogo").style.display = "block";

  // frontend image changed
  const logoImg = document.getElementById("profilePicture");
  logoImg ? (logoImg.src = logo) : console.log(logo);
 
 
  if (logo) {
    defaultLogo.style.display = "none";
  }
  else {
    defaultLogo.style.display = "block";

  }
  const userAvatar = document.getElementById("userAvatar");

  if (userAvatar) {
    userAvatar.innerHTML = `<img src="${logo}">`
  } else {
    console.log("error");
  }
  console.log(userAvatar);
}

fetchLogo();

if (createPostBtn) {
  createPostBtn.addEventListener("click", function () {
    postForm.classList.toggle("hidden");
  });

  submitPostBtn.addEventListener("click", async function () {
    // Get current user from Supabase Auth
    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    let file = image.files[0];
    if (!file) {
      Swal.fire("Please select an image file.");
      return;
    }
    let userSession = session.user;
    console.log(userSession);

    let filePath = `public/${userSession.id}${Date.now()}`;

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
      email: userSession.email,
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
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  // console.log(session.user.user_metadata.email);

  const { data: updatData, error: updatError } = await client
    .from("post_app")
    .select("*")
    .eq("email", session.user.user_metadata.email);

  if (updatError) {
    Swal.fire("Error", error.message, "error");
    return;
  }

  postShow.innerHTML = ""; // Clear old posts

  updatData.forEach((element) => {
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

async function renderPost() {
  const { data: updatData, error: updatError } = await client
    .from("post_app")
    .select("*");

  updatError
    ? Swal.fire("Error", error.message, "error")
    : console.log("updatData");

  postFeed.innerHTML = ""; // Clear old posts

  updatData.forEach((element) => {
    postFeed.innerHTML += `
     <div class="post-card">
     <img src="${element.file}" alt="Post Image">
     <h3>${element.post_title}</h3>
     <p>${element.post_content}</p>
     <span>Posted by: ${element.email}</span>
     </div>`;
  });
}
renderPost();

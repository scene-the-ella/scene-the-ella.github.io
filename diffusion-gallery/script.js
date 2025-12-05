// 갤러리 데이터
// GitHub Pages 배포 시: https://scene-the-ella.github.io/diffusion-gallery/
// 모든 파일(svg_input, output_videos)을 같은 폴더에 배치하거나
// 상대 경로를 사용하여 같은 저장소 내의 파일을 참조하세요
const galleryData = [
    {
        id: 1,
        inputImage: 'svg_input/volcano.svg',
        title: 'Volcano',
        description: '화산 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/volcano.gif',
                thumbnail: 'output_videos/volcano.gif'
            },
            {
                src: 'output_videos/volcano.mp4',
                thumbnail: 'output_videos/volcano.gif'
            }
        ]
    },
    {
        id: 2,
        inputImage: 'svg_input/hamburger.svg',
        title: 'Hamburger',
        description: '햄버거 이미지를 입력으로 사용한 애니메이션 생성 결과입니다.',
        videos: [
            {
                src: 'output_videos/hamburger.gif',
                thumbnail: 'output_videos/hamburger.gif'
            },
            {
                src: 'output_videos/hamburger.mp4',
                thumbnail: 'output_videos/hamburger.gif'
            }
        ]
    }
];

// 갤러리 렌더링
function renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!galleryGrid) return;

    galleryGrid.innerHTML = galleryData.map(item => `
        <div class="gallery-item">
            <div class="input-section">
                <div class="input-image-container">
                    <img src="${item.inputImage}" alt="${item.title}" loading="lazy">
                </div>
                <div class="input-info">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                </div>
            </div>
            <div class="videos-section">
                <h4>생성된 애니메이션 (${item.videos.length})</h4>
                <div class="videos-grid">
                    ${item.videos.map((video, index) => {
                        // GIF 파일인 경우 img 태그 사용, MP4인 경우 video 태그 사용
                        const isGif = video.src.endsWith('.gif');
                        return `
                        <div class="video-item" data-video-src="${video.src}" data-item-id="${item.id}" data-video-index="${index}">
                            ${isGif ? 
                                `<img src="${video.src}" alt="${item.title} animation ${index + 1}" loading="lazy">` :
                                `<video 
                                    src="${video.src}" 
                                    poster="${video.thumbnail}"
                                    preload="metadata"
                                    muted
                                    loop
                                ></video>`
                            }
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // 비디오 호버 이벤트 추가
    setupVideoInteractions();
}

// 비디오 인터랙션 설정
function setupVideoInteractions() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const video = item.querySelector('video');
        const img = item.querySelector('img');
        const videoSrc = item.getAttribute('data-video-src');
        
        // GIF 이미지인 경우
        if (img) {
            // 클릭 시 모달로 확대
            item.addEventListener('click', () => {
                showVideoModal(videoSrc, 'gif');
            });
            return;
        }
        
        // 비디오인 경우
        if (video) {
            // 호버 시 재생
            item.addEventListener('mouseenter', () => {
                video.play().catch(e => console.log('비디오 재생 실패:', e));
                item.classList.add('playing');
            });
            
            // 마우스가 벗어나면 일시정지
            item.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
                item.classList.remove('playing');
            });
            
            // 클릭 시 모달로 확대
            item.addEventListener('click', () => {
                showVideoModal(video.src, 'video');
            });
        }
    });
}

// 비디오 모달 표시
function showVideoModal(mediaSrc, type = 'video') {
    // 모달이 없으면 생성
    let modal = document.getElementById('videoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'videoModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        
        // 닫기 버튼 이벤트
        const closeModal = () => {
            const modalVideo = modal.querySelector('video');
            if (modalVideo) {
                modalVideo.pause();
            }
            modal.classList.remove('active');
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', closeModal);
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    // 모달 내용 업데이트
    if (type === 'gif') {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${mediaSrc}" alt="Animation" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
            </div>
        `;
    } else {
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <video controls autoplay>
                    <source src="${mediaSrc}" type="video/mp4">
                    브라우저가 비디오 태그를 지원하지 않습니다.
                </video>
            </div>
        `;
    }
    
    // 닫기 버튼 이벤트 다시 연결
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        const modalVideo = modal.querySelector('video');
        if (modalVideo) {
            modalVideo.pause();
        }
        modal.classList.remove('active');
    });
    
    modal.classList.add('active');
}

// 페이지 로드 시 갤러리 렌더링
document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
});

// 이미지 로드 에러 처리
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'https://via.placeholder.com/400x400/667eea/ffffff?text=Image+Not+Found';
    }
}, true);
